import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/categories";

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={category.href} className="group flex flex-col items-center text-center">
      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.label}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 45vw, 200px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-300">
            Sin imagen
          </div>
        )}
        {category.tag && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-neutral-800 shadow-sm">
            {category.tag}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm font-bold text-neutral-900">{category.label}</p>
    </Link>
  );
}