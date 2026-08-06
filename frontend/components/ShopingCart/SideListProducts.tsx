"use client";
import { useState } from "react";
import Link from "next/link";
import { cartProducts, type CartItem } from "@/lib/cartProducts";
import { formatPrice } from "@/lib/utils";
import ItemList from "./ItemList";

type SideListProps = {
  isOpen: boolean;
  onClose: () => void;
  topOffset: number;
};

export default function SideListProducts({ isOpen, onClose, topOffset }: SideListProps) {
  const [items, setItems] = useState<CartItem[]>(cartProducts);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function handleIncrease(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  function handleDecrease(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
      )
    );
  }

  function handleRemove(id: string) {
    // 1. Marca el item como "saliendo" -> dispara la animación
    setRemovingIds((prev) => new Set(prev).add(id));

    // 2. Después de que termine la transición, lo quita del arreglo real
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  }


  return (
  <>
    {/* Overlay */}
    <div
      onClick={onClose}
      style={{ top: topOffset }}
      className={`fixed inset-x-0 bottom-0 bg-black/50 z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    />

    {/* Panel */}
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
            <li><button onClick={onClose} className="bg-white text-black text-xs items-center rounded-2xl py-1 px-2 transition-transform duration-75 ease-in-out hover:scale-105">X Cerrar</button></li>
          </ul>
        </div>
        {/* Considerar añadir una sección de descuentos según la cantidad de productos seleccionados */}
        {/* <div>BARRA HORIZONTAL QUE MUESTRA EL DESCUENTO OBTENIDO POR LA CANTIDAD DE ZAPATOS EN EL CARRITO</div> */}

        {/* TODO: take this code and put it on a new component called 'ProductItem' */}
        {items.map((item) => (
          <ItemList
            key={item.id}
            item={item}
            isRemoving={removingIds.has(item.id)}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            onRemove={handleRemove}
            onLinkClick={onClose}
          />
        ))}

        
      </nav>

        {/* TODO: cambiar la ruta, probablemente no haremos una página de checkout si no que usaremos stripe directamente */}
        <Link href={'/checkout'} className="group">
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