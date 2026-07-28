"use client";
import Link from "next/link";
import { categories } from "@/lib/categories";

type SideMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  topOffset: number;
};

export default function SideMenu({ isOpen, onClose, topOffset }: SideMenuProps) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ top: topOffset }}
        className={`fixed inset-x-0 bottom-0 bg-black/50 z-10 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel */}
      <aside
        style={{ top: topOffset, height: `calc(100vh - ${topOffset}px)` }}
        className={`fixed left-0 w-full min-[750px]:w-96 bg-white z-20
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-y-0" : "translate-y-full"}
          flex flex-col`}
      >
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-rose-50/40">
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              onClick={onClose}
              className="flex items-center gap-4 bg-white border border-gray-100 
                         rounded-xl p-3 hover:border-gray-300 transition-colors"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {cat.image ? (
                  <img src={cat.image} alt={cat.label} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base">{cat.label}</span>
                {cat.tag && <span className="text-sm text-red-400">{cat.tag}</span>}
              </div>
            </Link>
          ))}
            {/* TODO: add a footer in this component and a list of classic pages (nosotros, productos, contacto, etc.) */}
            <div>
                <ul>
                    <li>NOSOTROS</li>
                    <li>PRODUCTOS</li>
                    <li>CONTACTO</li>
                </ul>
            </div>
            <footer>somthing</footer>

        </nav>
      </aside>
    </>
  );
}