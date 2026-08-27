import Image from "next/image";
import Link from "next/link";
import type { Product } from "./types";

interface ProductCardProps {
  product: Product;
}

/**
Renderiza la calificación de un producto como 5 estrellas.
Las estrellas hasta `rating`.
*/
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill={i < Math.round(rating) ? "currentColor" : "#e5e7eb"}
          className="h-3.5 w-3.5"
        >
          <path d="M10 15.27 16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
        </svg>
      ))}
    </div>
  );
}

/*
Tarjeta individual de producto dentro del catálogo.
*/
export default function ProductCard({ product }: ProductCardProps) {
  const detailHref = `/catalogo/${product.categoria}/${product.slug}`;

  return (
    <div className="flex flex-col">
      <Link href={detailHref} className="contents">
        {/* Contenedor de imagen.*/}
        <div className="group relative aspect-3/4 w-full overflow-hidden bg-gray-100">
          {/* Imagen principal: visible por defecto, se desvanece al hacer hover
              (solo si el producto tiene una imagen alternativa configurada) */}
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={`object-cover transition-opacity duration-300 ${
              product.hoverImage ? "group-hover:opacity-0" : ""
            }`}
          />
          {/* Imagen hover. Se omite por completo si el producto no tiene hoverImage. */}
          {product.hoverImage && (
            <Image
              src={product.hoverImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="absolute inset-0 object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
          {/* Etiqueta visual de "Agotado" sobre la imagen cuando no hay existencias */}
          {!product.inStock && (
            <span className="absolute left-2 top-2 rounded bg-black/80 px-2 py-1 text-[10px] font-semibold uppercase text-white">
              Agotado
            </span>
          )}
        </div>
        {/* Bloque de información*/}
        <div className="mt-3 flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-black">
            {product.code} {product.name}
          </h3>

          {/* Calificación */}
          {typeof product.rating === "number" && (
            <div className="flex items-center gap-1">
              <Stars rating={product.rating} />
              {typeof product.reviewsCount === "number" && (
                <span className="text-xs text-gray-500">
                  ({product.reviewsCount})
                </span>
              )}
            </div>
          )}
          {/* Precio individual */}
          <p className="text-sm text-black">
            Precio individual:{" "}
            <span className="font-bold">${product.price.toFixed(2)}</span>
          </p>
          {/* Precio de mayoreo: aplica a partir de "cantMinMayoreo" pares */}
          <p className="text-sm text-gray-700">
            Mayoreo ({product.cantMinMayoreo}+ pares):{" "}
            <span className="font-bold">
              ${product.precioMayoreo.toFixed(2)}
            </span>{" "}
            c/u
          </p>
        </div>
      </Link>
      {/* Botón de compra: fuera del Link para que un click aquí no navegue */}
      <button
        type="button"
        disabled={!product.inStock}
        className="mt-3 w-full bg-black py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {product.inStock ? "Agregar al carrito" : "Agotado"}
      </button>
    </div>
  );
}