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

const CART_ID_COOKIE = "cart_id";

function getCartId(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CART_ID_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCartId(id: string) {
  document.cookie = `${CART_ID_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 30}`;
}

// ---------------------------------------------------------------
// EL ADAPTADOR: traduce el line item "crudo" de Medusa hacia tu CartItem.
// Esta es la ÚNICA función que debe conocer los nombres de campo de Medusa.
// Ningún componente (ItemList, SideListProducts, etc.) debe leer
// item.unit_price o item.variant_title directamente — siempre pasan
// por aquí primero.
// ---------------------------------------------------------------
function mapLineItem(item: any): CartItem {
  return {
    id: item.id,
    variantId: item.variant_id ?? "",
    slug: item.product_handle ?? "",
    name: item.product_title ?? item.title,
    size: item.variant_title ?? "",
    image: item.thumbnail ?? undefined,
    quantity: Number(item.quantity),
    price: Number(item.unit_price),
    originalPrice: item.compare_at_unit_price
      ? Number(item.compare_at_unit_price)
      : undefined,
    currency: "mxn",
    // wholesaleLabel: pendiente, se calculará después con el endpoint custom
  };
}

export async function getOrCreateCart(): Promise<{ cartId: string; items: CartItem[] }> {
  let cartId = getCartId();

  if (cartId) {
    try {
      const { cart } = await sdk.store.cart.retrieve(cartId);
      
      console.log(JSON.stringify(cart.items, null, 2));
      return { cartId: cart.id, items: (cart.items ?? []).map(mapLineItem) }; // <- aquí se usa el adaptador
    } catch {
      cartId = null;
    }
  }

  const { cart } = await sdk.store.cart.create({ currency_code: "mxn" });
  setCartId(cart.id);
  return { cartId: cart.id, items: [] };
}

export async function updateLineItemQuantity(
  cartId: string,
  lineItemId: string,
  quantity: number
): Promise<CartItem[]> {
  const { cart } = await sdk.store.cart.updateLineItem(cartId, lineItemId, { quantity });
  return (cart.items ?? []).map(mapLineItem);
}

export async function removeLineItem(
  cartId: string,
  lineItemId: string
): Promise<CartItem[]> {
  await sdk.store.cart.deleteLineItem(cartId, lineItemId);
  const { cart } = await sdk.store.cart.retrieve(cartId);
  return (cart.items ?? []).map(mapLineItem);
}