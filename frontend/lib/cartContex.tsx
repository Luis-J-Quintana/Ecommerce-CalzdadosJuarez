// lib/cartContex.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  getOrCreateCart,
  addLineItem,
  updateLineItemQuantity,
  removeLineItem,
  syncWholesalePricing,
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

type CartSnapshot = { items: CartItem[]; wholesale: WholesaleInfo };

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

  // Copia síncrona de items: evita leer valores viejos al pulsar +/- rápido
  const itemsRef = useRef<CartItem[]>([]);
  // Cola: las operaciones del carrito se ejecutan una tras otra
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingRef = useRef(0);

  const commitItems = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  // Inicializar carrito
  useEffect(() => {
    let mounted = true;
    getOrCreateCart()
      .then(({ cartId, items, wholesale }) => {
        if (!mounted) return;
        setCartId(cartId);
        commitItems(items);
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
  }, [commitItems]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const hideToast = useCallback(() => {
    setToast((prev) => (prev ? { ...prev, visible: false } : null));
  }, []);

  const showToast = useCallback((message: string, productName?: string) => {
    setToast({ visible: true, message, productName });
    setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, visible: false } : null));
    }, 4000);
  }, []);

  // Ejecuta las operaciones una por una, en el orden en que se pulsaron
  const enqueue = useCallback((task: () => Promise<void>): Promise<void> => {
    pendingRef.current += 1;
    const run = queueRef.current
      .then(task)
      .catch((err) => console.error("Error en operación del carrito:", err))
      .finally(() => {
        pendingRef.current -= 1;
      });
    queueRef.current = run;
    return run;
  }, []);

  // Solo la ÚLTIMA operación de la cola pinta el estado del servidor;
  // las intermedias se ignoran porque ya hay algo más nuevo pendiente.
  const applyServer = useCallback(
    (res: CartSnapshot) => {
      if (pendingRef.current > 1) return;
      commitItems(res.items);
      setWholesale(res.wholesale);
    },
    [commitItems]
  );

  const resync = useCallback(
    async (id: string) => {
      try {
        applyServer(await syncWholesalePricing(id));
      } catch (err) {
        console.error("No se pudo resincronizar el carrito:", err);
      }
    },
    [applyServer]
  );

  // Valores calculados localmente: barra y texto siempre coinciden
  const totalPairs = items.reduce((sum, item) => sum + item.quantity, 0);
  const threshold = wholesale.threshold;
  const isWholesale = totalPairs >= threshold;
  const pairsUntilWholesale = Math.max(0, threshold - totalPairs);
  const wholesaleLabel = isWholesale
    ? wholesale.label ?? `Precio de mayoreo (${threshold}+ pares)`
    : null;

  async function addItem(
    variantId: string,
    quantity: number = 1,
    productName?: string
  ): Promise<boolean> {
    if (!cartId) {
      console.warn("No hay carrito disponible aún");
      return false;
    }

    let ok = false;
    await enqueue(async () => {
      try {
        applyServer(await addLineItem(cartId, variantId, quantity));
        ok = true;
        showToast(
          productName
            ? `¡${productName} agregado al carrito!`
            : "¡Producto agregado al carrito!",
          productName
        );
      } catch (err) {
        console.error("Error al agregar producto al carrito:", err);
        showToast("Error al agregar el producto. Intenta nuevamente.");
        await resync(cartId);
      }
    });
    return ok;
  }

  function setQuantity(id: string, quantity: number): Promise<void> {
    if (!cartId) return Promise.resolve();
    // Optimista, partiendo SIEMPRE del valor más reciente
    commitItems(
      itemsRef.current.map((it) => (it.id === id ? { ...it, quantity } : it))
    );
    return enqueue(async () => {
      try {
        applyServer(await updateLineItemQuantity(cartId, id, quantity));
      } catch (err) {
        console.error("Error al actualizar cantidad:", err);
        await resync(cartId);
      }
    });
  }

  async function increase(id: string) {
    const current = itemsRef.current.find((it) => it.id === id);
    if (!current) return;
    await setQuantity(id, current.quantity + 1);
  }

  async function decrease(id: string) {
    const current = itemsRef.current.find((it) => it.id === id);
    if (!current) return;
    if (current.quantity <= 1) return remove(id);
    await setQuantity(id, current.quantity - 1);
  }

  async function remove(id: string) {
    if (!cartId) return;
    commitItems(itemsRef.current.filter((it) => it.id !== id));
    await enqueue(async () => {
      try {
        applyServer(await removeLineItem(cartId, id));
      } catch (err) {
        console.error("Error al eliminar item del carrito:", err);
        await resync(cartId);
      }
    });
  }

  return (
    <CartContext.Provider
      value={{
        items,
        cartId,
        isLoading,
        totalPairs,
        isWholesale,
        pairsUntilWholesale,
        wholesaleLabel,
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