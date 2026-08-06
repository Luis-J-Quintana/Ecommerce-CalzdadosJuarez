import type { Product } from "./types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
}

/**
 * Gird que organiza las tarjetas de producto. Solo recibe la lista procesada y la renderiza en un layout
 * de 2 columnas en móvil y 4 en pantallas grandes.
 */
export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="px-4 py-16 text-center text-sm text-gray-500">
        No hay productos que coincidan con los filtros seleccionados.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}