import { products } from "@/lib/products";
import ProductCard from "./ProductCard";

export default function NewThisWeekSection() {
  const newProducts = products.filter((product) => product.isNew);

  return (
    /* TODO: corregir la sobreposición de esta ultima sección con el footer, 
      posiblemente el error viene del otro componente */
    <section className="w-full px-6 py-10">
      <h2 className="mb-6 text-3xl font-black uppercase tracking-tight">
        Lo nuevo de la semana
      </h2>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {newProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}