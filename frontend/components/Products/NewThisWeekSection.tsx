import { products } from "@/lib/products";
import ProductGrid from "@/components/Catalogo/ProductGrid";
import Link from "next/link";

const MAX_NEW_PRODUCTS = 4;

export default function NewThisWeekSection() {
  const newProducts = products
    .filter((product) => product.isNew)
    .slice(0, MAX_NEW_PRODUCTS);

  return (
    /* TODO: corregir la sobreposición de esta ultima sección con el footer, 
      posiblemente el error viene del otro componente */
    <section className="w-full px-6 py-10">
      <h2 className="mb-6 text-3xl font-black uppercase tracking-tight">
        Lo nuevo de la semana
      </h2>

      <ProductGrid products={newProducts} />

      <div className="flex justify-center my-12">
        <Link href={"/catalogo"}>
          {/* TODO: colocar botón dentro de una etiqueta Link que te envie a la vista Catálogo */}
          <button className="bg-black text-white text-xl font-bold border-2 rounded-md px-4 py-2 hover:bg-white hover:text-black transition delay-100">VER TODO</button>
        </Link>
        
      </div>
    </section>
  );
}