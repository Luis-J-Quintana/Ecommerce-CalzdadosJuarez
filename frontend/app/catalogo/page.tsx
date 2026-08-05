import CatalogView from "@/components/layout/Catalogo/CatalogoView";
import { products } from "@/lib/products";

/**
 * Es donde debe apuntar el botón "Ver todo" del home.
*/
export default function CatalogoTodoPage() {
  return <CatalogView title="Todos los productos" products={products} />;
}