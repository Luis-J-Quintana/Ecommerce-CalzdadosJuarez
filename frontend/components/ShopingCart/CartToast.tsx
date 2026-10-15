"use client";

import { useCart } from "@/lib/cartContex";
import { LuCircleCheck, LuX, LuShoppingCart } from "react-icons/lu";

export default function CartToast() {
  const { toast, hideToast, openCart } = useCart();

  if (!toast || !toast.visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white">
          <LuCircleCheck size={20} />
        </div>

        <div className="flex-1 pr-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Carrito actualizado
          </p>
          <p className="mt-0.5 text-sm font-bold text-gray-900">
            {toast.message}
          </p>

          <button
            onClick={() => {
              hideToast();
              openCart();
            }}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
          >
            <LuShoppingCart size={14} />
            Ver carrito
          </button>
        </div>

        <button
          onClick={hideToast}
          aria-label="Cerrar notificación"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <LuX size={18} />
        </button>
      </div>
    </div>
  );
}
