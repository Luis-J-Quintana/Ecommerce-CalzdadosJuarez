// lib/cartContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getOrCreateCart, updateLineItemQuantity, removeLineItem, type CartItem } from "@/lib/cartProducts";

type CartContextValue = {
  items: CartItem[];
  increase: (id: string) => void;
  decrease: (id: string) => void;
  remove: (id: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartId, setCartId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    getOrCreateCart().then(({ cartId, items }) => {
      setCartId(cartId);
      setItems(items);
    });
  }, []);

  async function increase(id: string) {
    if (!cartId) return;
    const target = items.find((item) => item.id === id);
    if (!target) return;

    // actualización optimista: se ve instantáneo en UI
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );

    try {
      console.log('increase product quantity');// faild down here
      const updated = await updateLineItemQuantity(cartId, id, target.quantity + 1);
      setItems(updated); // confirma con lo que Medusa realmente guardó
    } catch (err) {
      console.error("Error al incrementar cantidad:", err);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity: target.quantity } : item))
      ); // revierte si falló
    }
  }

  async function decrease(id: string) {
    if (!cartId) return;
    const target = items.find((item) => item.id === id);
    if (!target) return;

    const newQuantity = Math.max(1, target.quantity - 1);

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item))
    );

    try {
      console.log('decrease product quantity');// faild down here
      const updated = await updateLineItemQuantity(cartId, id, newQuantity);
      setItems(updated);
    } catch (err) {
      console.error("Error al decrementar cantidad:", err);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity: target.quantity } : item))
      );
    }
  }

  async function remove(id: string) {
    if (!cartId) return;
    const previousItems = items;

    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      const updated = await removeLineItem(cartId, id);
      setItems(updated);
    } catch {
      setItems(previousItems); // revierte si falló
    }
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