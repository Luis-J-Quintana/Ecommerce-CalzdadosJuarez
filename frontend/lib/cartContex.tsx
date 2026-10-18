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
  fetchServerCart,
  syncCart,
  toDesiredItems,
  visualPrice,
  computeFallbackWholesale,
  DEFAULT_MAX_QUANTITY,
  INITIAL_WHOLESALE_THRESHOLD,
  type CartItem,
  type CartSnapshot,
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
  /** Umbral global de pares (el de la última respuesta de sync). */
  threshold: number;
  pairsUntilWholesale: number;
  wholesaleLabel: string | null;
  maxQuantity: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (variantId: string, quantity?: number, productName?: string) => Promise<boolean>;
  setQuantity: (id: string, quantity: number) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  remove: (id: string) => void;
  toast: CartToastState | null;
  hideToast: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Espera tras el último cambio antes de enviar el estado completo al servidor. */
const SYNC_DEBOUNCE_MS = 300;

// Solo hasta la primera respuesta del servidor.
const DEFAULT_WHOLESALE: WholesaleInfo = computeFallbackWholesale([], INITIAL_WHOLESALE_THRESHOLD);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartId, setCartId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [wholesale, setWholesale] = useState<WholesaleInfo>(DEFAULT_WHOLESALE);
  const [maxQuantity, setMaxQuantity] = useState<number>(DEFAULT_MAX_QUANTITY);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<CartToastState | null>(null);

  // Copia síncrona de items: evita leer valores viejos al pulsar +/- rápido
  const itemsRef = useRef<CartItem[]>([]);
  const cartIdRef = useRef<string | null>(null);
  const maxQuantityRef = useRef(DEFAULT_MAX_QUANTITY);

  // Control de sincronización: versión local vs. versión enviada
  const versionRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const flushAgainRef = useRef(false);
  // Quienes esperan el resultado del próximo envío (p. ej. addItem)
  const waitersRef = useRef<((ok: boolean) => void)[]>([]);

  const commitItems = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const applySnapshot = useCallback(
    (snap: CartSnapshot) => {
      commitItems(snap.items);
      // Un cálculo local de respaldo conserva el último umbral que mandó el servidor.
      setWholesale((prev) =>
        snap.fromServer ? snap.wholesale : computeFallbackWholesale(snap.items, prev.threshold)
      );
      maxQuantityRef.current = snap.maxQuantity;
      setMaxQuantity(snap.maxQuantity);
    },
    [commitItems]
  );

  /** Hay cambios locales que el servidor aún no recibió. */
  const hasPendingChanges = (sentVersion: number) =>
    versionRef.current !== sentVersion || timerRef.current !== null;

  // Inicializar carrito
  useEffect(() => {
    let mounted = true;
    getOrCreateCart()
      .then(({ cartId, ...snap }) => {
        if (!mounted) return;
        cartIdRef.current = cartId;
        setCartId(cartId);
        applySnapshot(snap);
      })
      .catch((err) => {
        console.error("Error al inicializar el carrito:", err);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [applySnapshot]);

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

  /**
   * Envía el estado completo deseado. Solo un envío a la vez; si hubo cambios
   * mientras tanto, se envía otra vez al terminar.
   */
  const flush = useCallback(async () => {
    timerRef.current = null;
    const id = cartIdRef.current;
    if (!id) return;
    if (inFlightRef.current) {
      flushAgainRef.current = true;
      return;
    }

    inFlightRef.current = true;
    const sentVersion = versionRef.current;
    const waiters = waitersRef.current.splice(0);
    let ok = false;

    try {
      const snap = await syncCart(id, toDesiredItems(itemsRef.current));
      ok = true;
      // El servidor solo reemplaza el estado local si no hay cambios pendientes
      if (!hasPendingChanges(sentVersion)) applySnapshot(snap);
    } catch (err) {
      console.error("Error al sincronizar el carrito:", err);
      // Rollback: si no hay cambios más nuevos, volver al estado real del servidor.
      // Si los hay, el próximo envío (estado completo, idempotente) lo corrige.
      if (!hasPendingChanges(sentVersion)) {
        try {
          applySnapshot(await fetchServerCart(id));
        } catch (resyncErr) {
          console.error("No se pudo resincronizar el carrito:", resyncErr);
        }
      }
    } finally {
      inFlightRef.current = false;
      waiters.forEach((resolve) => resolve(ok));
      if (flushAgainRef.current) {
        flushAgainRef.current = false;
        void flush();
      }
    }
  }, [applySnapshot]);

  /** Aplica un cambio local al instante y programa el envío con debounce. */
  const change = useCallback(
    (next: CartItem[]) => {
      commitItems(next);
      versionRef.current += 1;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void flush(), SYNC_DEBOUNCE_MS);
    },
    [commitItems, flush]
  );

  const waitForSync = () =>
    new Promise<boolean>((resolve) => waitersRef.current.push(resolve));

  /** Única ruta para cambiar cantidades: botones, input y agregar. */
  const setQuantity = useCallback(
    (id: string, quantity: number) => {
      const current = itemsRef.current;
      if (!current.some((it) => it.id === id)) return;
      if (quantity <= 0) {
        change(current.filter((it) => it.id !== id));
        return;
      }
      const clamped = Math.min(Math.floor(quantity), maxQuantityRef.current);
      change(current.map((it) => (it.id === id ? { ...it, quantity: clamped } : it)));
    },
    [change]
  );

  const increase = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((it) => it.id === id);
      if (item) setQuantity(id, item.quantity + 1);
    },
    [setQuantity]
  );

  const decrease = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((it) => it.id === id);
      if (item) setQuantity(id, item.quantity - 1);
    },
    [setQuantity]
  );

  const remove = useCallback((id: string) => setQuantity(id, 0), [setQuantity]);

  async function addItem(
    variantId: string,
    quantity: number = 1,
    productName?: string
  ): Promise<boolean> {
    if (!cartIdRef.current) {
      console.warn("No hay carrito disponible aún");
      return false;
    }

    const existing = itemsRef.current.find((it) => it.variantId === variantId);
    if (existing) {
      setQuantity(existing.id, existing.quantity + quantity);
    } else {
      // Línea provisional: el servidor la reemplaza con los datos reales
      change([
        ...itemsRef.current,
        {
          id: `pending:${variantId}`,
          variantId,
          slug: "",
          name: productName ?? "Producto",
          size: "",
          quantity: Math.min(quantity, maxQuantityRef.current),
          price: 0,
          currency: "mxn",
          pending: true,
        },
      ]);
    }

    const ok = await waitForSync();
    showToast(
      ok
        ? productName
          ? `¡${productName} agregado al carrito!`
          : "¡Producto agregado al carrito!"
        : "Error al agregar el producto. Intenta nuevamente.",
      ok ? productName : undefined
    );
    return ok;
  }

  // Valores calculados localmente: barra, texto y precios siempre coinciden
  const totalPairs = items.reduce((sum, item) => sum + item.quantity, 0);
  const threshold = wholesale.threshold;
  const isWholesale = totalPairs >= threshold;
  const pairsUntilWholesale = Math.max(0, threshold - totalPairs);
  const wholesaleLabel = isWholesale
    ? wholesale.label ?? `Precio de mayoreo (${threshold}+ pares)`
    : null;

  // Precio visual según el total local de pares (antes de que responda el servidor)
  const visibleItems = items.map((it) => {
    const usesWholesale = isWholesale && it.wholesalePrice !== undefined;
    return {
      ...it,
      price: visualPrice(it, isWholesale),
      wholesaleLabel: usesWholesale ? wholesaleLabel ?? undefined : undefined,
    };
  });

  return (
    <CartContext.Provider
      value={{
        items: visibleItems,
        cartId,
        isLoading,
        totalPairs,
        isWholesale,
        threshold,
        pairsUntilWholesale,
        wholesaleLabel,
        maxQuantity,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        setQuantity,
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
