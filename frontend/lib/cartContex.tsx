"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { cartProducts as initialCartProducts, type CartItem } from "@/lib/cartProducts";

type CartContextValue = {
  items: CartItem[];
  increase: (id: string) => void;
  decrease: (id: string) => void;
  remove: (id: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Fuente única de verdad del carrito. Envuelve la app (ver layout raíz)
 * para que tanto SideListProducts (header) como OrderSummary (checkout)
 * lean y modifiquen exactamente el mismo estado.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(initialCartProducts);

  function increase(id: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
  }

  function decrease(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
      )
    );
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <CartContext.Provider value={{ items, increase, decrease, remove }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de un <CartProvider>");
  }
  return ctx;
}