"use client";
import Link from "next/link";
import Image from "next/image";
import { LuX, LuTag } from "react-icons/lu";
import { type CartItem } from "@/lib/cartProducts";
import CustomIcon from "../layout/CustomIcon";
import { formatPrice } from "@/lib/utils";

type ItemListProps = {
  item: CartItem;
  isRemoving: boolean;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
  onLinkClick: () => void; // para cerrar el panel al navegar al producto
};

export default function ItemList({
  item,
  isRemoving,
  onIncrease,
  onDecrease,
  onRemove,
  onLinkClick,
}: ItemListProps) {
  return (
    <div className={`flex items-start gap-4 py-5 border-b border-gray-100 last:border-b-0 transition-all duration-300 ease-in-out ${
        isRemoving
          ? "max-h-0 py-0 opacity-0 scale-95"
          : "max-h-96 py-5 opacity-100 scale-100"}`}>
      <Link
        href={`/productos/${item.slug}`}
        onClick={onLinkClick}
        className="relative w-20 h-20 sm:w-28 sm:h-28 shrink-0 rounded-lg overflow-hidden bg-gray-100"
      >
        {item.image ? (
            /* Corregir los estilos cuando utilicemos imagenes reales */
            <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 80px, 112px"
                className="object-cover"
            />
          
        ) : (
          <div className="w-full h-full" />
        )}
      </Link>

      <div className="flex flex-1 min-w-0 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/productos/${item.slug}`} onClick={onLinkClick} className="min-w-0">
            <span className="font-bold text-base leading-tight line-clamp-2 wrap-break-word">
              {item.name}
            </span>
          </Link>
          <button
            onClick={() => onRemove(item.id)}
            aria-label={`Quitar ${item.name} del carrito`}
            className="shrink-0 text-gray-400 hover:text-gray-600"
          >
            <CustomIcon icon={LuX} size={18} />
          </button>
        </div>

        <span className="text-sm text-gray-500">Talla: {item.size}</span>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 text-sm">
            <button
              onClick={() => onDecrease(item.id)}
              className="flex h-6 w-6 items-center justify-center text-gray-500 hover:text-black"
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <span className="w-4 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => onIncrease(item.id)}
              className="flex h-6 w-6 items-center justify-center text-gray-500 hover:text-black"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>

          <div className="flex items-baseline gap-2 flex-wrap">
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(item.originalPrice, item.currency)}
              </span>
            )}
            <span className="text-base font-bold">
              {formatPrice(item.price, item.currency)}
            </span>
          </div>
        </div>

        {item.wholesaleLabel && (
          <span className="inline-flex w-fit h-1/2 items-center gap-2 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-bold text-black">
            <CustomIcon icon={LuTag} size={14} />
            {item.wholesaleLabel}
          </span>
        )}
      </div>
    </div>
  );
}