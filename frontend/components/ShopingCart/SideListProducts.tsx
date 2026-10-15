"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cartContex";
import { formatPrice } from "@/lib/utils";
import ItemList from "./ItemList";
import WholesaleProgressBar from "./WholesaleProgressBar";
import { LuShoppingBag } from "react-icons/lu";

type SideListProps = {
  isOpen?: boolean;
  onClose?: () => void;
  topOffset?: number;
};

export default function SideListProducts({
  isOpen: propsIsOpen,
  onClose: propsOnClose,
  topOffset = 0,
}: SideListProps) {
  const {
    items,
    totalPairs,
    isWholesale,
    increase,
    decrease,
    remove,
    isOpen: contextIsOpen,
    closeCart,
  } = useCart();

  const isOpen = propsIsOpen ?? contextIsOpen;
  const handleClose = propsOnClose ?? closeCart;

  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function handleRemove(id: string) {
    setRemovingIds((prev) => new Set(prev).add(id));

    setTimeout(() => {
      remove(id);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{ top: topOffset }}
        className={`fixed inset-x-0 bottom-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        style={{ top: topOffset, height: `calc(100vh - ${topOffset}px)` }}
        className={`fixed left-0 w-full sm:w-96 bg-white z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col shadow-2xl`}
      >
        {/* Header */}
        <div className="bg-black p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wide">TU CARRITO</span>
              {totalPairs > 0 && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
                  {totalPairs} {totalPairs === 1 ? "par" : "pares"}
                </span>
              )}
            </div>
            <button
              onClick={handleClose}
              className="rounded-full bg-white px-3 py-1 text-xs font-bold text-black transition-transform duration-150 hover:scale-105 active:scale-95"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        {/* Barra de progreso de mayoreo */}
        <div className="border-b border-gray-100 bg-gray-50/50 p-4">
          <WholesaleProgressBar />
        </div>

        {/* Lista de productos */}
        <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-4">
                <LuShoppingBag size={32} />
              </div>
              <p className="text-base font-bold text-gray-900">Tu carrito está vacío</p>
              <p className="mt-1 text-xs text-gray-500 max-w-xs">
                Explora nuestro catálogo y agrega tus modelos favoritos para menudeo o mayoreo.
              </p>
              <Link
                href="/catalogo"
                onClick={handleClose}
                className="mt-6 rounded-full bg-black px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-transform hover:scale-105"
              >
                Ver Catálogo
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <ItemList
                key={item.id}
                item={item}
                isRemoving={removingIds.has(item.id)}
                onIncrease={increase}
                onDecrease={decrease}
                onRemove={handleRemove}
                onLinkClick={handleClose}
              />
            ))
          )}
        </nav>

        {/* Footer Checkout */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Subtotal estimado</span>
              <div className="text-right">
                <span className="text-lg font-black text-black">
                  {formatPrice(total, "MXN")}
                </span>
                {isWholesale && (
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">
                    Precio de mayoreo aplicado
                  </p>
                )}
              </div>
            </div>

            <Link href="/checkout" onClick={handleClose} className="block group">
              <div className="flex w-full items-center justify-center rounded-xl bg-black py-4 text-white shadow-lg transition-transform duration-150 ease-in-out group-hover:scale-[1.02] active:scale-[0.98]">
                <span className="font-bold text-sm tracking-wider uppercase">
                  Proceder al Pago · {formatPrice(total, "MXN")}
                </span>
              </div>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}