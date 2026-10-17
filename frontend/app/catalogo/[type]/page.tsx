import { notFound } from "next/navigation";
import CatalogView from "@/components/Catalogo/CatalogoView";
import { getCategoryByHandle, getProducts } from "@/lib/medusa-products";

export const revalidate = 60;

interface CatalogoTypePageProps {
  params: Promise<{ type: string }>;
}

export default async function CatalogoTypePage({ params }: CatalogoTypePageProps) {
  const { type } = await params;

  const category = await getCategoryByHandle(type);
  if (!category) notFound();

  const products = await getProducts(type);

  return <CatalogView title={category.name} products={products} />;
}