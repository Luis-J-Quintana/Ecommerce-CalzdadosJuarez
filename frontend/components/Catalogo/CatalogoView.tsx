"use client";

import { useMemo, useState } from "react";
import FilterBar from "./FilterBar";
import ProductGrid from "./ProductGrid";
import type { AvailabilityFilter, Product, SortOption } from "./types";

interface CatalogViewProps {
  title: string; //Título (según categoría)
  products: Product[]; //Lista completa de productos a mostrar (ya filtrada por categoría si aplica)
}

/*
Componente principal del catálogo. Recibe la lista "cruda" de
productos y se encarga de:

1. Calcular los límites y opciones disponibles para los filtros.
2. Guardar el estado actual de filtros y orden seleccionados.
3. Aplicar esos filtros/orden sobre la lista de productos.
4. Renderizar la barra de filtros (FilterBar) y la cuadrícula (ProductGrid)
   con el resultado ya procesado.

 Tanto la vista "Ver todo" como la vista por categoría reutilizan este
 mismo componente, solo cambia que `products` y `title` se le pasan.
*/
export default function CatalogView({ title, products }: CatalogViewProps) {
  // Calcula el precio más bajo y más alto entre todos los productos recibidos.
  // Sirve como límite (min/max) para el filtro de precio.
  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 };
    const prices = products.map((p) => p.price);
    return { min: Math.min(...prices), max: Math.max(...prices) }; //El min y max es basado en los precios
  }, [products]);

  // Es la lista que muestra el filtro "Tallas de calzado"
  const allSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.sizes.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [products]);

  // Estado de los filtros y el orden actualmente seleccionados
  const [priceRange, setPriceRange] = useState<[number, number]>([
    priceBounds.min,
    priceBounds.max,
  ]);
  const [availability, setAvailability] = useState<AvailabilityFilter>("todos");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("mas-vendidos");

  // Aplica los filtros activos y luego ordena el resultado según `sortBy`.
  // Se recalcula solo cuando cambia alguno de sus dependencias,
  // para no repetir el filtrado en cada render.
  const filteredProducts = useMemo(() => {
    const result = products.filter((p) => {
      // Descarta productos fuera del rango de precio seleccionado
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      // Filtro de disponibilidad
      if (availability === "en-stock" && !p.inStock) return false;
      if (availability === "agotado" && p.inStock) return false;
      // Filtro de talla
      if (selectedSize && !p.sizes.includes(selectedSize)) return false;
      return true;
    });

    // Ordena el resultado ("Ordenar por")
    return result.sort((a, b) => {
      switch (sortBy) {
        case "mas-vendidos":
          // De mayor a menor cantidad vendida
          return b.soldCount - a.soldCount;
        case "antiguo-reciente":
          // Fecha de creación ascendente (los más viejos primero)
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "reciente-antiguo":
          // Fecha de creación descendente
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "precio-mayor-menor":
          return b.price - a.price;
        case "precio-menor-mayor":
          return a.price - b.price;
        default:
          return 0;
      }
    });
  }, [products, priceRange, availability, selectedSize, sortBy]);

  return (
    <div>
      <h1 className="px-4 pt-6 text-xl font-semibold">{title}</h1>
      {/* Barra de filtros: recibe el estado actual y los setters como callbacks */}
      <FilterBar
        totalCount={filteredProducts.length}
        priceBounds={priceBounds}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        availability={availability}
        onAvailabilityChange={setAvailability}
        sizes={allSizes}
        selectedSize={selectedSize}
        onSizeChange={setSelectedSize}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Cuadrícula con el resultado ya filtrado*/}
      <ProductGrid products={filteredProducts} />
    </div>
  );
}