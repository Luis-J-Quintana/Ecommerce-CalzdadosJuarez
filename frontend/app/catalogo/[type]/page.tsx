import { notFound } from "next/navigation";
import { categories } from "@/lib/categories";
import { products } from "@/lib/products";
import CatalogView from "@/components/layout/Catalogo/CatalogoView";

interface CatalogoTypePageProps {
  params: Promise<{
    /** Segmento dinámico de la URL, ej: en /catalogo/sandalias -> type = "sandalias" */
    type: string;
  }>;
}

/**
 * Página del catálogo filtrada por categoría (ruta /catalogo/[type]).
*/
export default async function CatalogoTypePage({ params }: CatalogoTypePageProps) {
  // Esperaa la Promise para obtener el valor real del segmento dinámico
  const { type } = await params;
  // Busca la categoría real en lib/categories.ts)
  const category = categories.find((c) => c.href.replace(/^\//, "") === type);

  // Si el "type" de la URL no coincide con ninguna categoría existente, se muestra la página 404
  if (!category) {
    notFound();
  }
  // Filtra únicamente los productos que pertenecen a esta categoría
  const categoryProducts = products.filter((p) => p.categoria === type);

  return <CatalogView title={category.label} products={categoryProducts} />;
}