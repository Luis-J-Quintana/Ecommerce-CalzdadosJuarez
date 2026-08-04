import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/utils";


export default function ProductCard({ product }: { product: Product }) {
  return (
    /* TODO: cambiar el la dirección del link a la vista de la información detallada del producto (supongo que será un commponente reutilizable) */
    <Link href={`/productos/${product.slug}`} className="flex flex-col">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 90vw, 400px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-300">
            Sin imagen
          </div>
        )}
      </div>

      <h3 className="mt-4 text-base font-bold text-neutral-900">{product.name}</h3>
      <p className="mt-1 text-base text-neutral-900">
        {formatPrice(product.price, product.currency)}
      </p>

      {product.installments && (
        <p className="mt-1 text-sm font-semibold text-red-600">
          Paga a {product.installments} MSI
        </p>
      )}

      {product.wholesaleTiers && product.wholesaleTiers.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {product.wholesaleTiers.map((tier) => (
            <span
              key={tier.quantity}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700"
            >
              {tier.quantity} pares:{" "}
              <strong className="text-neutral-900">
                {formatPrice(tier.pricePerUnit, product.currency)}
              </strong>{" "}
              c/u
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}