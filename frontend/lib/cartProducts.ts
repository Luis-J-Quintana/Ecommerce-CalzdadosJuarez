// lib/cartProducts.ts
import { sdk } from "./medusa-client";

export type CartItem = {
  id: string;
  variantId: string;
  slug: string;
  name: string;
  size: string;
  image?: string;
  quantity: number;
  price: number;
  /** Precio normal de la línea (sin mínimo), según el servidor. */
  retailPrice?: number;
  /** Precio de mayoreo de la línea, según el servidor. */
  wholesalePrice?: number;
  originalPrice?: number;
  currency: string;
  wholesaleLabel?: string;
  /** Línea agregada localmente que el servidor aún no confirma. */
  pending?: boolean;
};

export type WholesaleInfo = {
  applied: boolean;
  totalPairs: number;
  threshold: number;
  pairsRemaining: number;
  label: string | null;
};

export type CartResponseData = CartSnapshot & {
  cartId: string;
};

export type CartSnapshot = {
  items: CartItem[];
  wholesale: WholesaleInfo;
  maxQuantity: number;
  /**
   * true si `wholesale` (umbral incluido) viene de una respuesta de sync; false
   * si es un cálculo local de respaldo, que no debe pisar el último umbral conocido.
   */
  fromServer: boolean;
};

/** Estado deseado que se envía a PUT /store/custom/carts/:id/sync. */
export type DesiredItem = { variant_id: string; quantity: number };

const CART_ID_COOKIE = "cart_id";
/** Umbral solo hasta la primera respuesta del servidor; luego manda el de sync. */
export const INITIAL_WHOLESALE_THRESHOLD = 15;
/** Debe coincidir con MAX_ITEM_QUANTITY del backend; el servidor lo confirma en cada respuesta. */
export const DEFAULT_MAX_QUANTITY = 9999;

function getCartId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CART_ID_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCartId(id: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${CART_ID_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

const optionalNumber = (v: unknown) =>
  v === null || v === undefined || !Number.isFinite(Number(v)) ? undefined : Number(v);

/**
 * ADAPTADOR: Traduce el line item "crudo" de Medusa hacia el CartItem del frontend.
 */
function mapLineItem(item: any, wholesaleLabel?: string | null): CartItem {
  return {
    id: item.id,
    variantId: item.variant_id ?? "",
    slug: item.product_handle ?? item.variant?.product?.handle ?? "",
    name: item.product_title ?? item.title ?? "Calzado",
    size: item.variant_title ?? item.variant?.title ?? "",
    image: item.thumbnail ?? item.variant?.thumbnail ?? undefined,
    quantity: Number(item.quantity || 0),
    price: Number(item.unit_price || 0),
    retailPrice: optionalNumber(item.retail_price),
    wholesalePrice: optionalNumber(item.wholesale_price),
    originalPrice: item.compare_at_unit_price
      ? Number(item.compare_at_unit_price)
      : undefined,
    currency: "mxn",
    wholesaleLabel: wholesaleLabel ?? undefined,
  };
}

/**
 * Calcula localmente el estado de mayoreo si el endpoint de backend no está disponible.
 */
export function computeFallbackWholesale(
  items: { quantity?: unknown }[],
  threshold = INITIAL_WHOLESALE_THRESHOLD
): WholesaleInfo {
  const totalPairs = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const applied = totalPairs >= threshold;
  return {
    applied,
    totalPairs,
    threshold,
    pairsRemaining: Math.max(0, threshold - totalPairs),
    label: applied ? `Precio de mayoreo (${threshold}+ pares)` : null,
  };
}

/**
 * Precio que se muestra mientras el servidor no confirma: usa el de mayoreo si el
 * total local de pares alcanza el umbral, y el normal si no (igual que el backend).
 */
export function visualPrice(item: CartItem, isWholesale: boolean): number {
  if (isWholesale && item.wholesalePrice !== undefined) return item.wholesalePrice;
  return item.retailPrice ?? item.price;
}

/** Convierte las líneas locales en el estado deseado (una entrada por variante). */
export function toDesiredItems(items: CartItem[]): DesiredItem[] {
  const byVariant = new Map<string, number>();
  for (const it of items) {
    if (!it.variantId) continue;
    byVariant.set(it.variantId, (byVariant.get(it.variantId) ?? 0) + it.quantity);
  }
  return Array.from(byVariant, ([variant_id, quantity]) => ({ variant_id, quantity }));
}

/**
 * Envía el estado completo deseado del carrito. El servidor agrega, actualiza o
 * elimina líneas para igualarlo y aplica el mayoreo. Es idempotente.
 */
export async function syncCart(cartId: string, items: DesiredItem[]): Promise<CartSnapshot> {
  const res = await sdk.client.fetch<{
    cart: any;
    wholesale: {
      applied: boolean;
      total_pairs: number;
      threshold: number;
      pairs_remaining: number;
      wholesale_label: string | null;
    };
    max_quantity: number;
  }>(`/store/custom/carts/${cartId}/sync`, {
    method: "PUT",
    body: { items },
  });

  const wholesale: WholesaleInfo = {
    applied: res.wholesale.applied,
    totalPairs: res.wholesale.total_pairs,
    threshold: res.wholesale.threshold,
    pairsRemaining: res.wholesale.pairs_remaining,
    label: res.wholesale.wholesale_label,
  };

  const labelToApply = wholesale.applied ? wholesale.label : null;
  return {
    items: (res.cart?.items ?? []).map((item: any) => mapLineItem(item, labelToApply)),
    wholesale,
    maxQuantity: Number(res.max_quantity) || DEFAULT_MAX_QUANTITY,
    fromServer: true,
  };
}

/**
 * Estado real del carrito en el servidor. Reenvía las cantidades actuales al
 * endpoint de sync (no cambia nada, solo aplica el mayoreo y trae los precios
 * por línea). Si ese endpoint falla, usa el carrito "crudo" de Medusa.
 */
export async function fetchServerCart(cartId: string): Promise<CartSnapshot> {
  const { cart } = await sdk.store.cart.retrieve(cartId);
  const current = (cart.items ?? []).map((item: any) => ({
    variant_id: item.variant_id as string,
    quantity: Number(item.quantity || 0),
  }));

  try {
    return await syncCart(cartId, current.filter((i) => i.variant_id));
  } catch (err) {
    console.warn("Falló el sync del carrito, usando el carrito de Medusa:", err);
    const wholesale = computeFallbackWholesale(cart.items ?? []);
    const labelToApply = wholesale.applied ? wholesale.label : null;
    return {
      items: (cart.items ?? []).map((item: any) => mapLineItem(item, labelToApply)),
      wholesale,
      maxQuantity: DEFAULT_MAX_QUANTITY,
      fromServer: false,
    };
  }
}

/**
 * Obtiene o crea un carrito activo.
 */
export async function getOrCreateCart(): Promise<CartResponseData> {
  const cartId = getCartId();

  if (cartId) {
    try {
      return { cartId, ...(await fetchServerCart(cartId)) };
    } catch {
      // El carrito de la cookie ya no existe: se crea uno nuevo
    }
  }

  const { cart } = await sdk.store.cart.create({
    region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID,
  });
  setCartId(cart.id);
  try {
    // Sync vacío: no cambia nada, pero trae el umbral real del servidor.
    return { cartId: cart.id, ...(await syncCart(cart.id, [])) };
  } catch {
    return {
      cartId: cart.id,
      items: [],
      wholesale: computeFallbackWholesale([]),
      maxQuantity: DEFAULT_MAX_QUANTITY,
      fromServer: false,
    };
  }
}
