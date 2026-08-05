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
  categoria: string; /* Categoría a la que pertenece el producto - Debe ser igual a lo que hay en lib/categories */
  price: number; /* Precio individual */
  precioMayoreo: number; /*Precio mayoreo*/
  cantMinMayoreo: number; /* Cantidad minima para ser mayorista*/
  image: string;
  hoverImage?: string;
  sizes: string[];
  inStock: boolean;
  soldCount: number; /*Cantidad vendidos - Lo usa FilterBar para dar "más vendidos" */
  createdAt: string; /* Fecha que se agregó el producto */
  rating?: number; /* Calificación estrellas */
  reviewsCount?: number; /* Num. de reseñas que tiene el producto */
}