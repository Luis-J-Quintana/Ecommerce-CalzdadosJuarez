import { WHOLESALE_MIN_QUANTITY, hasRules } from "./wholesale-pricing";

/**
 * Regla de mayoreo del carrito (lógica pura, sin IO).
 *
 * El umbral es global: se suman los pares de TODAS las líneas del carrito y,
 * si llegan a WHOLESALE_THRESHOLD, cada línea usa su precio de mayoreo.
 * La usan POST /store/custom/carts/:id/sync-wholesale y el workflow sync-cart-items.
 */

// El umbral de pares coincide con el min_quantity del precio de mayoreo.
export const WHOLESALE_THRESHOLD = WHOLESALE_MIN_QUANTITY;

/** Campos de query.graph del carrito necesarios para resolver precios por línea. */
export const CART_WHOLESALE_FIELDS = [
  "id",
  "currency_code",
  "metadata",
  "items.*",
  "items.variant_id",
  "items.variant.id",
  "items.variant.metadata",
  "items.variant.product.metadata",
  "items.variant.price_set.prices.*",
  "items.variant.price_set.prices.price_rules.*",
];

export type WholesaleSummary = {
  applied: boolean;
  total_pairs: number;
  threshold: number;
  pairs_remaining: number;
  wholesale_label: string | null;
};

export function summarizeWholesale(items: { quantity?: unknown }[]): WholesaleSummary {
  const totalPairs = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const applied = totalPairs >= WHOLESALE_THRESHOLD;
  return {
    applied,
    total_pairs: totalPairs,
    threshold: WHOLESALE_THRESHOLD,
    pairs_remaining: Math.max(0, WHOLESALE_THRESHOLD - totalPairs),
    wholesale_label: applied ? `Precio de mayoreo (${WHOLESALE_THRESHOLD}+ pares)` : null,
  };
}

/**
 * Precio normal y de mayoreo de una línea, en la moneda del carrito.
 * - Normal: precio sin min_quantity y sin reglas; si no hay, metadata.precio_menudeo
 *   de la variante o del producto. Nunca un precio con min_quantity.
 * - Mayoreo: precio con min_quantity >= WHOLESALE_MIN_QUANTITY (o > 1); si no hay,
 *   metadata.precio_mayoreo de la variante o del producto; si no, el menor de
 *   varios precios.
 */
export function resolveLinePrices(
  item: any,
  currencyCode: string
): { retail: number | null; wholesale: number | null } {
  const prices: any[] =
    item.variant?.price_set?.prices?.filter(
      (p: any) => (p.currency_code || "").toLowerCase() === currencyCode
    ) ?? [];

  let retail: number | null = null;
  const retailFromPrices = prices.find((p) => p.min_quantity == null && !hasRules(p));
  if (retailFromPrices) {
    retail = Number(retailFromPrices.amount);
  } else if (item.variant?.metadata?.precio_menudeo != null) {
    retail = Number(item.variant.metadata.precio_menudeo);
  } else if (item.variant?.product?.metadata?.precio_menudeo != null) {
    retail = Number(item.variant.product.metadata.precio_menudeo);
  }

  let wholesale: number | null = null;
  const wholesaleFromPrices =
    prices.find((p) => Number(p.min_quantity) >= WHOLESALE_MIN_QUANTITY) ??
    prices.find((p) => p.min_quantity != null && Number(p.min_quantity) > 1);
  if (wholesaleFromPrices) {
    wholesale = Number(wholesaleFromPrices.amount);
  } else if (item.variant?.metadata?.precio_mayoreo != null) {
    wholesale = Number(item.variant.metadata.precio_mayoreo);
  } else if (item.variant?.product?.metadata?.precio_mayoreo != null) {
    wholesale = Number(item.variant.product.metadata.precio_mayoreo);
  } else if (prices.length > 1) {
    // Si hay varios precios sin min_quantity explícito, el menor es el de mayoreo
    wholesale = Math.min(...prices.map((p) => Number(p.amount)));
  }

  return { retail, wholesale };
}

export type LineUpdate = { id: string; unit_price: number; is_custom_price: boolean };

export type LinePricing = {
  id: string;
  retail_price: number | null;
  wholesale_price: number | null;
};

/**
 * Calcula qué líneas cambiar para aplicar (o quitar) el mayoreo.
 *
 * Con mayoreo, la línea queda con unit_price = mayoreo e is_custom_price = true,
 * para que los recálculos de Medusa (p. ej. al actualizar esa línea o al cambiar
 * de cliente) no la regresen al precio calculado. Sin mayoreo, vuelve al precio
 * normal con is_custom_price = false, para que Medusa la vuelva a calcular.
 */
export function planCartWholesale(cart: any): {
  wholesale: WholesaleSummary;
  updates: LineUpdate[];
  lines: LinePricing[];
} {
  const items: any[] = cart.items ?? [];
  const wholesale = summarizeWholesale(items);
  const currencyCode = (cart.currency_code || "mxn").toLowerCase();

  const updates: LineUpdate[] = [];
  const lines: LinePricing[] = [];

  for (const item of items) {
    const { retail, wholesale: wholesalePrice } = resolveLinePrices(item, currencyCode);
    lines.push({ id: item.id, retail_price: retail, wholesale_price: wholesalePrice });

    const useWholesale = wholesale.applied && wholesalePrice !== null;
    const target = useWholesale ? wholesalePrice : retail;
    const isCustom = useWholesale;

    if (target === null) {
      // Sin precio conocido: solo se libera el precio fijo para que Medusa lo recalcule.
      if (item.is_custom_price && !wholesale.applied) {
        updates.push({ id: item.id, unit_price: Number(item.unit_price), is_custom_price: false });
      }
      continue;
    }

    if (Number(item.unit_price) !== target || !!item.is_custom_price !== isCustom) {
      updates.push({ id: item.id, unit_price: target, is_custom_price: isCustom });
    }
  }

  return { wholesale, updates, lines };
}

/** Clave del lock que serializa las sincronizaciones de un carrito. */
export const cartSyncLockKey = (cartId: string) => `custom-cart-sync:${cartId}`;
