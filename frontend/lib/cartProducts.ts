import type { Product } from "./products";
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

function findProduct(id: string): Product {
  const product = products.find((p) => p.id === id);
  if (!product) {
    throw new Error(`Mock inválido: no existe un product con id "${id}"`);
  }
  return product;
}

export const cartProducts: CartItem[] = [
  {
    id: "cart-item-1",
    productId: "292ar-negro",
    slug: findProduct("292ar-negro").slug,
    name: findProduct("292ar-negro").name,
    size: "22.5",
    image: findProduct("292ar-negro").image,
    quantity: 2,
    price: 993.88,
    originalPrice: 1343.08,
    currency: "MXN",
    /* wholesaleLabel: "Precios mayoreo 3 pares surtidos", */
  },
  {
    id: "cart-item-2",
    productId: "310ar-blanco",
    slug: findProduct("310ar-blanco").slug,
    name: findProduct("310ar-blanco").name,
    size: "23",
    image: findProduct("310ar-blanco").image,
    quantity: 1,
    price: 446.85,
    originalPrice: 603.85,
    currency: "MXN",
    wholesaleLabel: "Precios mayoreo 3 pares surtidos",
  },
];