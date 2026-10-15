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
  originalPrice?: number;
  currency: string;
  wholesaleLabel?: string;
};

export type WholesaleInfo = {
  applied: boolean;
  totalPairs: number;
  threshold: number;
  pairsRemaining: number;
  label: string | null;
};

export type CartResponseData = {
  cartId: string;
  items: CartItem[];
  wholesale: WholesaleInfo;
};

const CART_ID_COOKIE = "cart_id";
const DEFAULT_WHOLESALE_THRESHOLD = 15;

function getCartId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CART_ID_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCartId(id: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${CART_ID_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

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
function computeFallbackWholesale(items: any[]): WholesaleInfo {
  const totalPairs = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const applied = totalPairs >= DEFAULT_WHOLESALE_THRESHOLD;
  return {
    applied,
    totalPairs,
    threshold: DEFAULT_WHOLESALE_THRESHOLD,
    pairsRemaining: Math.max(0, DEFAULT_WHOLESALE_THRESHOLD - totalPairs),
    label: applied ? "Precio de mayoreo (15+ pares)" : null,
  };
}

/**
 * Sincroniza los precios de mayoreo con el backend de Medusa.
 */
export async function syncWholesalePricing(cartId: string): Promise<{ items: CartItem[]; wholesale: WholesaleInfo }> {
  try {
    const res = await sdk.client.fetch<{
      cart: any;
      wholesale: {
        applied: boolean;
        total_pairs: number;
        threshold: number;
        pairs_remaining: number;
        wholesale_label: string | null;
      };
    }>(`/store/custom/carts/${cartId}/sync-wholesale`, {
      method: "POST",
    });

    const wholesale: WholesaleInfo = {
      applied: res.wholesale.applied,
      totalPairs: res.wholesale.total_pairs,
      threshold: res.wholesale.threshold,
      pairsRemaining: res.wholesale.pairs_remaining,
      label: res.wholesale.wholesale_label,
    };

    const labelToApply = wholesale.applied ? wholesale.label : null;
    const items = (res.cart?.items ?? []).map((item: any) => mapLineItem(item, labelToApply));

    return { items, wholesale };
  } catch (err) {
    console.warn("Fallo sync-wholesale en backend, usando retrieveCart como fallback:", err);
    const { cart } = await sdk.store.cart.retrieve(cartId);
    const wholesale = computeFallbackWholesale(cart.items ?? []);
    const labelToApply = wholesale.applied ? wholesale.label : null;
    const items = (cart.items ?? []).map((item: any) => mapLineItem(item, labelToApply));
    return { items, wholesale };
  }
}

/**
 * Obtiene o crea un carrito activo.
 */
export async function getOrCreateCart(): Promise<CartResponseData> {
  let cartId = getCartId();

  if (cartId) {
    try {
      const syncResult = await syncWholesalePricing(cartId);
      return {
        cartId,
        items: syncResult.items,
        wholesale: syncResult.wholesale,
      };
    } catch {
      cartId = null;
    }
  }

  const { cart } = await sdk.store.cart.create({ currency_code: "mxn" });
  setCartId(cart.id);
  const wholesale = computeFallbackWholesale([]);
  return { cartId: cart.id, items: [], wholesale };
}

/**
 * Agrega un nuevo producto/variante al carrito y sincroniza la regla de mayoreo.
 */
export async function addLineItem(
  cartId: string,
  variantId: string,
  quantity: number = 1
): Promise<{ items: CartItem[]; wholesale: WholesaleInfo }> {
  await sdk.store.cart.createLineItem(cartId, {
    variant_id: variantId,
    quantity,
  });

  return syncWholesalePricing(cartId);
}

/**
 * Actualiza la cantidad de un line item y sincroniza la regla de mayoreo.
 */
export async function updateLineItemQuantity(
  cartId: string,
  lineItemId: string,
  quantity: number
): Promise<{ items: CartItem[]; wholesale: WholesaleInfo }> {
  await sdk.store.cart.updateLineItem(cartId, lineItemId, { quantity });
  return syncWholesalePricing(cartId);
}

/**
 * Elimina un line item del carrito y sincroniza la regla de mayoreo.
 */
export async function removeLineItem(
  cartId: string,
  lineItemId: string
): Promise<{ items: CartItem[]; wholesale: WholesaleInfo }> {
  await sdk.store.cart.deleteLineItem(cartId, lineItemId);
  return syncWholesalePricing(cartId);
}