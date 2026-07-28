// lib/categories.ts
export type Category = {
  label: string;
  href: string;
  image?: string;   // vendrá de Medusa
  tag?: string;      // "Últimas piezas", "En oferta", etc.
};

export const categories: Category[] = [
  { label: "Rebajas", href: "/rebajas", tag: "Últimas piezas" },
  { label: "Casuales", href: "/casuales", tag: "¡Se están vendiendo rápido!" },
  { label: "Zapatillas", href: "/zapatillas" },
  { label: "Mini tacones", href: "/mini-tacones" },
  { label: "Botas", href: "/botas", tag: "En oferta" },
  { label: "Sandalias", href: "/sandalias" },
  { label: "Tenis", href: "/tenis" },
];