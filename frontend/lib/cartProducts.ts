import type { Product } from "@/components/Catalogo/types";
import { products } from "./products";

export type CartItem = {
  id: string;
  productId: string; // referencia al Product original (útil cuando venga de Medusa)
  slug: string;
  name: string;
  size: string;
  image?: string;
  quantity: number;
  price: number;           // precio final, con descuento aplicado
  originalPrice?: number;  // precio antes del descuento (opcional)
  currency: string;
  wholesaleLabel?: string; // ej. "Precios mayoreo 3 pares surtidos"
};

function findProduct(id: string): Product | undefined {
  const product = products.find((p) => p.id === id);
  if(!product)
  {
    console.warn(`Mock inválido: no existe un product con id "${id}"`);
  }
  return product;
}

function buildCartItem(
  id: string,
  productId: string,
  overrides: Omit<CartItem, "id" | "productId" | "slug" | "name" | "image">
): CartItem | null {
  const product = findProduct(productId);
  if (!product) return null;

  return {
    id,
    productId,
    slug: product.slug ?? '',
    name: product.name,
    image: product.image,
    ...overrides,
  };
}

export const cartProducts: CartItem[] = [
  buildCartItem("cart-item-1", "2502r-rojo", {
    size: "22.5",
    quantity: 2,
    price: 993.88,
    originalPrice: 1343.08,
    currency: "MXN",
    /* wholesaleLabel: "Precios mayoreo 3 pares surtidos", */
  }),
  buildCartItem("cart-item-2", "2503r-yute-natural", {
    size: "23",
    quantity: 1,
    price: 446.85,
    originalPrice: 603.85,
    currency: "MXN",
    wholesaleLabel: "Precios mayoreo 3 pares surtidos",
  }),
].filter((item): item is CartItem => item !== null);