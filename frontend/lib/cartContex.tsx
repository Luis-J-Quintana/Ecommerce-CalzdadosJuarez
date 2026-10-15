// lib/cartContex.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  getOrCreateCart,
  addLineItem,
  updateLineItemQuantity,
  removeLineItem,
  type CartItem,
  type WholesaleInfo,
} from "@/lib/cartProducts";

export type CartToastState = {
  visible: boolean;
  message: string;
  productName?: string;
};

type CartContextValue = {
  items: CartItem[];
  cartId: string | null;
  isLoading: boolean;
  totalPairs: number;
  isWholesale: boolean;
  pairsUntilWholesale: number;
  wholesaleLabel: string | null;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (variantId: string, quantity?: number, productName?: string) => Promise<boolean>;
  increase: (id: string) => Promise<void>;
  decrease: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toast: CartToastState | null;
  hideToast: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const DEFAULT_WHOLESALE: WholesaleInfo = {
  applied: false,
  totalPairs: 0,
  threshold: 15,
  pairsRemaining: 15,
  label: null,
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartId, setCartId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [wholesale, setWholesale] = useState<WholesaleInfo>(DEFAULT_WHOLESALE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<CartToastState | null>(null);

  // Inicializar carrito
  useEffect(() => {
    let mounted = true;
    getOrCreateCart()
      .then(({ cartId, items, wholesale }) => {
        if (!mounted) return;
        setCartId(cartId);
        setItems(items);
        setWholesale(wholesale);
      })
      .catch((err) => {
        console.error("Error al inicializar el carrito:", err);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const hideToast = useCallback(() => {
    setToast((prev) => (prev ? { ...prev, visible: false } : null));
  }, []);

  const showToast = useCallback((message: string, productName?: string) => {
    setToast({ visible: true, message, productName });
    // Ocultar automáticamente a los 4 segundos
    setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, visible: false } : null));
    }, 4000);
  }, []);

  const totalPairs = items.reduce((sum, item) => sum + item.quantity, 0);

  // Agregar producto al carrito desde PDP
  async function addItem(variantId: string, quantity: number = 1, productName?: string): Promise<boolean> {
    if (!cartId) {
      console.warn("No hay carrito disponible aún");
      return false;
    }

    try {
      const res = await addLineItem(cartId, variantId, quantity);
      setItems(res.items);
      setWholesale(res.wholesale);

      showToast(
        productName
          ? `¡${productName} agregado al carrito!`
          : "¡Producto agregado al carrito!",
        productName
      );
      return true;
    } catch (err) {
      console.error("Error al agregar producto al carrito:", err);
      showToast("Error al agregar el producto. Intenta nuevamente.");
      return false;
    }
  }

  // Incrementar cantidad
  async function increase(id: string) {
    if (!cartId) return;
    const target = items.find((item) => item.id === id);
    if (!target) return;

    const previousItems = items;
    const previousWholesale = wholesale;

    // Actualización optimista
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );

    try {
      const res = await updateLineItemQuantity(cartId, id, target.quantity + 1);
      setItems(res.items);
      setWholesale(res.wholesale);
    } catch (err) {
      console.error("Error al incrementar cantidad:", err);
      setItems(previousItems);
      setWholesale(previousWholesale);
    }
  }

  // Decrementar cantidad
  async function decrease(id: string) {
    if (!cartId) return;
    const target = items.find((item) => item.id === id);
    if (!target) return;

    if (target.quantity <= 1) {
      return remove(id);
    }

    const previousItems = items;
    const previousWholesale = wholesale;
    const newQuantity = target.quantity - 1;

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item))
    );

    try {
      const res = await updateLineItemQuantity(cartId, id, newQuantity);
      setItems(res.items);
      setWholesale(res.wholesale);
    } catch (err) {
      console.error("Error al decrementar cantidad:", err);
      setItems(previousItems);
      setWholesale(previousWholesale);
    }
  }

  // Eliminar producto
  async function remove(id: string) {
    if (!cartId) return;
    const previousItems = items;
    const previousWholesale = wholesale;

    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      const res = await removeLineItem(cartId, id);
      setItems(res.items);
      setWholesale(res.wholesale);
    } catch (err) {
      console.error("Error al eliminar item del carrito:", err);
      setItems(previousItems);
      setWholesale(previousWholesale);
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        cartId,
        isLoading,
        totalPairs,
        isWholesale: wholesale.applied,
        pairsUntilWholesale: wholesale.pairsRemaining,
        wholesaleLabel: wholesale.label,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        increase,
        decrease,
        remove,
        toast,
        hideToast,
      }}
    >
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