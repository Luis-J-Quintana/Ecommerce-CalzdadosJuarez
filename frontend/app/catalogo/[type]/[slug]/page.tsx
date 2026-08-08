import { notFound } from "next/navigation";
import { products } from "@/lib/products";
import ProductDetailView from "@/components/Catalogo/FichaTecnicaProducto/ProductDetailView";

interface ProductPageProps {
  params: Promise<{ type: string; slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = products.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} />;
}