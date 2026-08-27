import Image from "next/image";
import { LuX } from "react-icons/lu";
import type { CartItem } from "@/lib/cartProducts";
import { formatPrice } from "@/lib/utils";
import CustomIcon from "../layout/CustomIcon";

interface OrderSummaryItemProps {
  item: CartItem;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function OrderSummaryItem({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: OrderSummaryItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-14 w-14 shrink-0">
        <div className="relative h-full w-full overflow-hidden rounded-md bg-gray-100">
          {item.image && (
            <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
          )}
        </div>
      </div>

      <div className="flex flex-1 items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium leading-tight">{item.name}</p>
          <p className="text-xs text-gray-500">Talla: {item.size}</p>

          {/* Mismo control +/- que ItemList, en versión compacta */}
          <div className="flex items-center gap-1 rounded-md border border-gray-200 text-xs w-fit mt-1">
            <button
              onClick={() => onDecrease(item.id)}
              className="flex h-5 w-5 items-center justify-center text-gray-500 hover:text-black"
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <span className="w-4 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => onIncrease(item.id)}
              className="flex h-5 w-5 items-center justify-center text-gray-500 hover:text-black"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="whitespace-nowrap text-sm font-medium">
            {formatPrice(item.price, item.currency)}
          </span>
          <button
            onClick={() => onRemove(item.id)}
            aria-label={`Quitar ${item.name} del carrito`}
            className="text-gray-400 hover:text-gray-600"
          >
            <CustomIcon icon={LuX} size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}