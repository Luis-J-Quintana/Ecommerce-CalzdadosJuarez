import { categories } from "@/lib/categories";
import CategoryCard from "./CategoryCard";

export default function CategoryGrid() {
  return (
    <section className="w-full px-6 py-10">
      <h2 className="mb-6 text-2xl font-black uppercase tracking-tight">
        Categorías
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {categories.map((category) => (
          <CategoryCard key={category.href} category={category} />
        ))}
      </div>
    </section>
  );
}