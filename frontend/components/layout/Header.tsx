"use client"
import Link from 'next/link';
import { usePathname } from "next/navigation";

// Esto vendrá de Medusa más adelante
const categories = [
  { label: "Nosotros", href: "/nosotros" },
  { label: "Productos", href: "/productos" },
  { label: "Contáctanos", href: "/contacto" },
];

function LinkCategories() {
  const pathname = usePathname();

  return (
    <>
      {categories.map((cat) => {
        const isActive = pathname === cat.href;
        if (isActive){console.log('pasar prop al header')}

        return (
          <Link
            key={cat.href}
            href={cat.href}
            className={isActive ? "text-black font-bold" : "text-gray-500"}
          >
            {cat.label}
          </Link>
        );
      })}
    </>
  );
};

export default function Header() {
  const pathname = usePathname();
  const isCategorySelected = categories.some((cat) => cat.href === pathname);


  return (
    <div className="sticky top-0 h-16 bg-yellow-100 flex flex-col space-y-3">
      <nav>
          <ul className='flex justify-center'>
            {/* TODO: add sandwich menu, searching icon and cart*/}
            <Link href="/">LOGO CENTRADO</Link>
          </ul>
      </nav>
      {/* the nav behind it should apears only when some link were selected */}
      {isCategorySelected && (
        <nav className='flex justify-around'>
          <LinkCategories/>
        </nav>
      )}
    </div>
  );
}