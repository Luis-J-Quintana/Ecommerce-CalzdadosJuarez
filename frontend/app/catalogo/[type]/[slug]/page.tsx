import { notFound } from "next/navigation";
import ProductDetailView from "@/components/Catalogo/FichaTecnicaProducto/ProductDetailView";
import { getProductBySlug } from "@/lib/medusa-products";

interface ProductPageProps {
  params: Promise<{ type: string; slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return <ProductDetailView product={product} />;
}