import CatalogView from "@/components/Catalogo/CatalogoView";
import { getProducts } from "@/lib/medusa-products";

export const revalidate = 60; // refresca los datos cada 60 s

export default async function CatalogoTodoPage() {
  const products = await getProducts();
  return <CatalogView title="Todos los productos" products={products} />;
}