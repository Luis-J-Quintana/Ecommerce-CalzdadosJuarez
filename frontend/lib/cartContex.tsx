// lib/cartContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getOrCreateCart, type CartItem } from "@/lib/cartProducts";

type CartContextValue = {
  items: CartItem[];
  increase: (id: string) => void;
  decrease: (id: string) => void;
  remove: (id: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    getOrCreateCart().then(setItems);
  }, []);

  function increase(id: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
    // TODO: llamar a Medusa (updateLineItemQuantity) para persistir el cambio real
  }

  function decrease(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
      )
    );
    // TODO: llamar a Medusa (updateLineItemQuantity)
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    // TODO: llamar a Medusa (removeLineItem)
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