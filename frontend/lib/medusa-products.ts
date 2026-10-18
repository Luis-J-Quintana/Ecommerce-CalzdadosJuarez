import { sdk } from "./medusa-client";
import type { Product } from "@/components/Catalogo/types";

const FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*categories,*images,*options,*options.values,+metadata";

// ---------- Utilidades ----------
const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ---------- Región (se cachea para no pedirla en cada request) ----------
let cachedRegionId: string | undefined;

async function getRegionId() {
  if (cachedRegionId) return cachedRegionId;
  const { regions } = await sdk.store.region.list();
  cachedRegionId =
    regions.find((r) => r.currency_code === "mxn")?.id ?? regions[0]?.id;
  return cachedRegionId;
}

// ---------- Categorías ----------
export type CategoryNode = {
  id: string;
  name: string;
  handle: string;
  parent_category_id?: string | null;
  category_children?: CategoryNode[];
};

// Devuelve el id de la categoría y de todas sus descendientes
function collectIds(cat: CategoryNode): string[] {
  return [cat.id, ...(cat.category_children ?? []).flatMap(collectIds)];
}

/** Busca una categoría por handle (con sus hijas). Null si no existe. */
export async function getCategoryByHandle(
  handle: string
): Promise<CategoryNode | null> {
  const { product_categories } = await sdk.store.category.list({
    handle,
    include_descendants_tree: true,
  });
  return (product_categories[0] as CategoryNode) ?? null;
}

/** Árbol completo de categorías raíz (útil para el menú/navbar). */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const { product_categories } = await sdk.store.category.list({
    parent_category_id: "null",
    include_descendants_tree: true,
  });
  return product_categories as CategoryNode[];
}

// ---------- Mapper Medusa -> tu tipo Product ----------
function mapProduct(p: any): Product {
  const meta = p.metadata ?? {};

    // ---- Variantes: cada una con su talla, su precio y su disponibilidad ----
  const variants = (p.variants ?? []).map((v: any) => ({
    id: v.id,
    talla: v.title,
    precio: v.calculated_price?.calculated_amount ?? 0,
    inStock:
      !v.manage_inventory || v.allow_backorder || num(v.inventory_quantity) > 0,
  }));

  const prices = variants
    .map((v: any) => v.precio)
    .filter((n: number) => n > 0);
  const price = prices.length ? Math.min(...prices) : 0; // precio "desde"

  // ---- Tallas: solo las que existen como variante, ordenadas ----
  const sizes: string[] = Array.from(
    new Set<string>(variants.map((v: any) => v.talla))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  // ---- Imágenes ----
  const gallery: string[] = p.images?.map((i: any) => i.url) ?? [];
  const image = p.thumbnail ?? gallery[0] ?? "";

  // ---- Stock del producto: hay si alguna variante se puede comprar ----
  const inStock = variants.some((v: any) => v.inStock);

  // ---- Categorías ----
  const cats: any[] = p.categories ?? [];
  // Preferimos la categoría hija (la más específica)
  const principal = cats.find((c) => c.parent_category_id) ?? cats[0];

  // ---- "Nuevo": metadata.is_new, o creado hace menos de 30 días ----
  const createdMs = new Date(p.created_at).getTime();
  const isNew =
    meta.is_new !== undefined
      ? meta.is_new === true || meta.is_new === "true"
      : Date.now() - createdMs < 30 * 24 * 60 * 60 * 1000;

  return {
    id: p.id,
    code: meta.code ?? p.variants?.[0]?.sku ?? p.handle,
    name: p.title,
    price,
    precioMayoreo: num(meta.precio_mayoreo, price),
    cantMinMayoreo: num(meta.cant_min_mayoreo, 0),
    image,
    hoverImage: gallery[1],
    gallery,
    sizes,
    inStock,
    soldCount: num(meta.sold_count, 0),
    createdAt: p.created_at,
    rating: meta.rating !== undefined ? num(meta.rating) : undefined,
    reviewsCount:
      meta.reviews_count !== undefined ? num(meta.reviews_count) : undefined,
    isNew,
    slug: p.handle,
    currency:
      p.variants?.[0]?.calculated_price?.currency_code?.toUpperCase() ?? "MXN",
    installments:
      meta.installments !== undefined ? num(meta.installments) : undefined,
    descripcion: p.description ?? "",
    material: p.material ?? meta.material ?? undefined,
    categoria: principal?.handle ?? "",
    categorias: cats.map((c) => c.handle),
    categoriasInfo: cats.map((c) => ({ handle: c.handle, name: c.name })), // <-- NUEVA
    variants,
  };
}

// ---------- Consultas ----------
/**
 * Sin argumento: todos los productos.
 * Con handle: productos de esa categoría + los de sus subcategorías.
 */
export async function getProducts(categoryHandle?: string): Promise<Product[]> {
  const region_id = await getRegionId();
  const query: Record<string, any> = { region_id, fields: FIELDS, limit: 100 };

  if (categoryHandle) {
    const category = await getCategoryByHandle(categoryHandle);
    if (!category) return [];
    query.category_id = collectIds(category);
  }

  const { products } = await sdk.store.product.list(query);
  return products.map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const region_id = await getRegionId();
  const { products } = await sdk.store.product.list({
    handle: decodeURIComponent(slug),
    region_id,
    fields: FIELDS,
  });

  return products[0] ? mapProduct(products[0]) : null;
}