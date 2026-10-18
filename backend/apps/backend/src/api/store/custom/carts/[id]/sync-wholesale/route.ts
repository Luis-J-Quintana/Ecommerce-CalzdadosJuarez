import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { WHOLESALE_MIN_QUANTITY } from "../../../../../../lib/wholesale-pricing";

// El umbral de pares coincide con el min_quantity del precio de mayoreo.
const WHOLESALE_THRESHOLD = WHOLESALE_MIN_QUANTITY;

/**
 * POST /store/custom/carts/:id/sync-wholesale
 * Recalcula el unit_price de cada línea del carrito si se alcanza el umbral de
 * WHOLESALE_THRESHOLD pares.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params;
  const cartModuleService = req.scope.resolve(Modules.CART);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  let cartData: any = null;

  try {
    const { data } = await query.graph({
      entity: "cart",
      fields: [
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
      ],
      filters: { id },
    });
    cartData = data?.[0];
  } catch (err) {
    console.warn("No se pudo consultar cart con graph query, intentando retrieveCart:", err);
  }

  // Fallback si graph query no trajo datos completos
  if (!cartData) {
    cartData = await cartModuleService.retrieveCart(id, {
      relations: ["items"],
    });
  }

  const items = cartData.items ?? [];
  const totalPairs = items.reduce(
    (sum: number, item: any) => sum + Number(item.quantity || 0),
    0
  );

  const isWholesale = totalPairs >= WHOLESALE_THRESHOLD;
  const currencyCode = (cartData.currency_code || "mxn").toLowerCase();

  const updates: Array<{ id: string; unit_price: number }> = [];

  for (const item of items) {
    const prices = item.variant?.price_set?.prices?.filter(
      (p: any) => (p.currency_code || "").toLowerCase() === currencyCode
    ) ?? [];

    let targetPrice: number | null = null;

    if (isWholesale) {
      // 1. Buscar precio de mayoreo en prices con min_quantity >= WHOLESALE_MIN_QUANTITY o > 1
      const wholesaleFromPrices =
        prices.find((p: any) => Number(p.min_quantity) >= WHOLESALE_MIN_QUANTITY) ??
        prices.find((p: any) => p.min_quantity != null && Number(p.min_quantity) > 1);

      if (wholesaleFromPrices) {
        targetPrice = Number(wholesaleFromPrices.amount);
      } else if (item.variant?.metadata?.precio_mayoreo != null) {
        targetPrice = Number(item.variant.metadata.precio_mayoreo);
      } else if (item.variant?.product?.metadata?.precio_mayoreo != null) {
        targetPrice = Number(item.variant.product.metadata.precio_mayoreo);
      } else if (prices.length > 1) {
        // Si hay varios precios sin min_quantity explícito, el menor es el de mayoreo
        const minPrice = prices.reduce((min: any, p: any) =>
          Number(p.amount) < Number(min.amount) ? p : min
        );
        targetPrice = Number(minPrice.amount);
      }
    } else {
      // 1. Precio de menudeo: el MXN sin min_quantity y sin reglas. Nunca uno con
      // min_quantity (sería el de mayoreo) ni con reglas (p. ej. de región).
      const retailFromPrices = prices.find(
        (p: any) =>
          p.min_quantity == null &&
          !(p.price_rules?.length > 0) &&
          !(Number(p.rules_count) > 0)
      );

      if (retailFromPrices) {
        targetPrice = Number(retailFromPrices.amount);
      } else if (item.variant?.metadata?.precio_menudeo != null) {
        targetPrice = Number(item.variant.metadata.precio_menudeo);
      } else if (item.variant?.product?.metadata?.precio_menudeo != null) {
        targetPrice = Number(item.variant.product.metadata.precio_menudeo);
      }
    }

    if (targetPrice !== null && Number(item.unit_price) !== targetPrice) {
      updates.push({
        id: item.id,
        unit_price: targetPrice,
      });
    }
  }

  // Aplicar actualizaciones si hubo cambios de precio
  if (updates.length > 0) {
    try {
      await cartModuleService.updateLineItems(updates);
    } catch (err) {
      console.error("Error al actualizar unit_price de line items:", err);
      // Fallback uno a uno si la llamada en batch espera otro formato
      for (const update of updates) {
        try {
          await (cartModuleService as any).updateLineItems(update.id, {
            unit_price: update.unit_price,
          });
        } catch (innerErr) {
          console.error(`Error actualizando line item ${update.id}:`, innerErr);
        }
      }
    }
  }

  // Obtener carrito final con totales recalculados
  const updatedCart = await cartModuleService.retrieveCart(id, {
    relations: ["items"],
  });

  res.json({
    cart: updatedCart,
    wholesale: {
      applied: isWholesale,
      total_pairs: totalPairs,
      threshold: WHOLESALE_THRESHOLD,
      pairs_remaining: Math.max(0, WHOLESALE_THRESHOLD - totalPairs),
      wholesale_label: isWholesale ? `Precio de mayoreo (${WHOLESALE_THRESHOLD}+ pares)` : null,
    },
  });
}
