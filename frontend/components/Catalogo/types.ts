export type SortOption =
  | "mas-vendidos"
  | "antiguo-reciente"
  | "reciente-antiguo"
  | "precio-mayor-menor"
  | "precio-menor-mayor";

export type AvailabilityFilter = "todos" | "en-stock" | "agotado";

export interface Product {
  id: string;
  code: string;
  name: string; /* Nombre del producto */
  price: number; /* Precio individual */
  precioMayoreo?: number; /*Precio mayoreo (menor de sus variantes); vacío si no tiene mayoreo*/
  cantMinMayoreo?: number; /* Cantidad minima para ser mayorista (umbral global del servidor)*/
  image: string;
  hoverImage?: string;
  gallery?: string[];
  sizes: string[];
  inStock: boolean;
  soldCount: number; /*Cantidad vendidos - Lo usa FilterBar para dar "más vendidos" */
  createdAt: string; /* Fecha que se agregó el producto */
  rating?: number; /* Calificación estrellas */
  reviewsCount?: number; /* Num. de reseñas que tiene el producto */
  isNew?: boolean;
  slug?: string;
  currency?: string;
  installments?: number;

  /*Lo usa la vista detalle Producto */
  descripcion?: string;
  material?: string; 
  wholesaleTiers?: Array<{ quantity: number; price?: number; pricePerUnit?: number }>;
  variants?: Array<{ id: string; talla: string; precio: number; inStock: boolean }>;
  categoria: string; /* Categoría a la que pertenece el producto - Debe ser igual a lo que hay en lib/categories */
  categorias?: string[];
  categoriasInfo?: { handle: string; name: string }[];
}