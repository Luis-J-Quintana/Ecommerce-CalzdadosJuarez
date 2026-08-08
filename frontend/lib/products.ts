import type { Product } from "@/components/Catalogo/types";
import S11 from "@/icons/SandaliasTest/SandaliaTest1-1.jpg"
import S12 from "@/icons/SandaliasTest/SandaliaTest1-2.jpg"
import S21 from "@/icons/SandaliasTest/SandaliaTest2-1.jpg"
import S22 from "@/icons/SandaliasTest/SandaliaTest2-2.jpg"
import S31 from "@/icons/SandaliasTest/SandaliaTest3-1.jpg"
import S32 from "@/icons/SandaliasTest/SandaliaTest3-2.jpg"
import S41 from "@/icons/SandaliasTest/SandaliaTest4-1.jpg"
import S42 from "@/icons/SandaliasTest/SandaliaTest4-2.jpg"



// TODO: reemplazar esto por datos reales
export const products: Product[] = [
  {
    id: "2502r-rojo",
    slug: "2502r-rojo",
    code: "2502R",
    name: "Sintético Rojo",
    categoria: "casuales",
    price: 549.0,
    precioMayoreo: 399.0,
    cantMinMayoreo: 15,
    image: S11.src,
    hoverImage: S12.src,
    sizes: ["23", "24", "25", "26"],
    inStock: true,
    soldCount: 340,
    createdAt: "2026-01-15",
    rating: 5,
    reviewsCount: 13,
    isNew: true
  },
  {
    id: "2501r-nairobi-late",
    slug: "2501r-nairobi-late",
    code: "2501R",
    name: "Zapatilla Sintético Nairobi Late",
    categoria: "zapatillas",
    price: 529.0,
    precioMayoreo: 379.0,
    cantMinMayoreo: 15,
    image: S21.src,
    hoverImage: S22.src,
    sizes: ["23", "24", "25", "26"],
    inStock: true,
    soldCount: 512,
    createdAt: "2025-11-02",
    rating: 5,
    reviewsCount: 13,
    isNew: true

  },
  {
    id: "2502r-late",
    slug: "2502r-late",
    code: "2502R",
    name: "Zapatilla Sintético Late",
    categoria: "zapatillas",
    price: 549.0,
    precioMayoreo: 399.0,
    cantMinMayoreo: 15,
    image: S31.src,
    hoverImage: S32.src,
    sizes: ["22", "23", "24", "25", "26"],
    inStock: false,
    soldCount: 128,
    createdAt: "2026-03-20",
    rating: 5,
    reviewsCount: 12,
    isNew: true

  },
  {
    id: "2503r-yute-natural",
    slug: "2503r-yute-natural",
    code: "2503R",
    name: "Yute Natural/Nairobi Sándalo",
    categoria: "sandalias",
    price: 599.0,
    precioMayoreo: 429.0,
    cantMinMayoreo: 15,
    image: S41.src,
    hoverImage: S42.src,
    sizes: ["23", "24", "25", "26"],
    inStock: true,
    soldCount: 87,
    createdAt: "2025-08-10",
    rating: 5,
    reviewsCount: 17,
    isNew: true

  },
];