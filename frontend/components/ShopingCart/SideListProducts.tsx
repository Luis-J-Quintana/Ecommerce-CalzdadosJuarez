"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cartContex";
import { formatPrice } from "@/lib/utils";
import ItemList from "./ItemList";

type SideListProps = {
  isOpen: boolean;
  onClose: () => void;
  topOffset: number;
};

export default function SideListProducts({ isOpen, onClose, topOffset }: SideListProps) {
  // El estado real del carrito ahora vive en CartContext, no aquí.
  const { items, increase, decrease, remove } = useCart();

  // "removingIds" sigue siendo local: es puramente visual (la animación
  // de salida de este panel), no forma parte del estado del carrito.
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function handleRemove(id: string) {
    setRemovingIds((prev) => new Set(prev).add(id));

    setTimeout(() => {
      remove(id); // ahora sí toca el estado global compartido
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ top: topOffset }}
        className={`fixed inset-x-0 bottom-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        style={{ top: topOffset, height: `calc(100vh - ${topOffset}px)` }}
        className={`fixed left-0 min-w-1/3 min-[750px]:w-96 bg-white z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col`}
      >
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-rose-50/40">
          <div className="bg-black -mx-4 -mt-4 p-4">
            <ul className="flex flex-row justify-between">
              <li className="font-bold text-white text-xl items-center">TU CARRITO</li>
              <li>
                <button
                  onClick={onClose}
                  className="bg-white text-black text-xs items-center rounded-2xl py-1 px-2 transition-transform duration-75 ease-in-out hover:scale-105"
                >
                  X Cerrar
                </button>
              </li>
            </ul>
          </div>

          {items.map((item) => (
            <ItemList
              key={item.id}
              item={item}
              isRemoving={removingIds.has(item.id)}
              onIncrease={increase}
              onDecrease={decrease}
              onRemove={handleRemove}
              onLinkClick={onClose}
            />
          ))}
        </nav>

        <Link href={"/checkout"} className="group">
          <div className="flex justify-center bg-black text-white px-4 py-4">
            <span className="font-bold transition-transform duration-150 ease-in-out group-hover:scale-105">
              PAGO SEGURO - {formatPrice(total, "MXN")}
            </span>
          </div>
        </Link>
      </aside>
    </>
  );
}