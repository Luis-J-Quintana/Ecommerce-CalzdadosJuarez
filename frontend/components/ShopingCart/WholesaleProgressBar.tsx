"use client";

import { useCart } from "@/lib/cartContex";
import { LuSparkles, LuTag } from "react-icons/lu";

export default function WholesaleProgressBar() {
  const { totalPairs, isWholesale, pairsUntilWholesale } = useCart();
  const threshold = 15;
  const percentage = Math.min(100, Math.round((totalPairs / threshold) * 100));

  if (totalPairs === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <LuTag size={16} className="text-black shrink-0" />
          <span>Precio de mayoreo automático a partir de 15 pares surtidos</span>
        </div>
      </div>
    );
  }

  if (isWholesale) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-3.5 shadow-xs transition-all">
        <div className="flex items-center gap-2">
          <LuSparkles size={18} className="text-emerald-700 shrink-0" />
          <p className="text-xs font-bold text-emerald-900">
            ¡Precio de mayoreo desbloqueado! ({totalPairs} pares acumulados)
          </p>
        </div>
        <p className="mt-1 text-[11px] text-emerald-700">
          Todas las líneas de tu carrito tienen aplicado el precio mayorista.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700">
          Te faltan <span className="font-black text-black">{pairsUntilWholesale}</span> {pairsUntilWholesale === 1 ? "par" : "pares"} para precio mayoreo
        </span>
        <span className="font-bold text-gray-500">
          {totalPairs}/{threshold}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full bg-black transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-[11px] text-gray-500">
        * Aplica combinando cualquier modelo y talla de la tienda.
      </p>
    </div>
  );
}
