"use client";

import { useState } from "react";
import { useCart } from "@/lib/cartContex";
import { formatPrice } from "@/lib/utils";
import OrderSummaryItem from "./OrderSummaryItem";

export default function OrderSummary() {
  const { items, increase, decrease, remove } = useCart();
  const [discountCode, setDiscountCode] = useState("");

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-rose-50/40 px-6 pb-8 pt-14 sm:px-10 lg:h-full lg:px-12">
      <div className="flex flex-col gap-6 lg:sticky lg:top-14">
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <OrderSummaryItem
              key={item.id}
              item={item}
              onIncrease={increase}
              onDecrease={decrease}
              onRemove={remove}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="Código de descuento o tarjeta de regalo"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button
            type="button"
            disabled={discountCode.trim().length === 0}
            className="shrink-0 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 disabled:cursor-not-allowed enabled:bg-gray-200 enabled:text-black"
          >
            Aplicar
          </button>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">
              Subtotal · {totalCount} artículo{totalCount === 1 ? "" : "s"}
            </span>
            <span>{formatPrice(subtotal, "MXN")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Envío</span>
            <span className="text-gray-400">Introducir la dirección de envío</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <span className="text-base font-semibold">Total</span>
          <div className="text-right">
            <span className="mr-1 align-middle text-xs text-gray-500">MXN</span>
            <span className="text-lg font-bold">{formatPrice(subtotal, "MXN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}