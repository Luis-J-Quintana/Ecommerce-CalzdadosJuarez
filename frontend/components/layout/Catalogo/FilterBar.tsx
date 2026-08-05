"use client";

import { useEffect, useRef, useState } from "react";
import type { AvailabilityFilter, SortOption } from "./types";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "mas-vendidos", label: "Más vendidos" },
  { value: "antiguo-reciente", label: "De antiguo a reciente" },
  { value: "reciente-antiguo", label: "De reciente a antiguo" },
  { value: "precio-mayor-menor", label: "Precio, mayor a menor" },
  { value: "precio-menor-mayor", label: "Precio, menor a mayor" },
];

const AVAILABILITY_OPTIONS: { value: AvailabilityFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "en-stock", label: "En stock" },
  { value: "agotado", label: "Agotado" },
];

/*
 Props que recibe la barra de filtros.
*/
interface FilterBarProps {
  /* Cantidad de productos que quedaron después de aplicar los filtros */
  totalCount: number;
  /* Precio mínimo y máximo disponibles entre todos los productos*/
  priceBounds: { min: number; max: number };
  /* Rango de precio actualmente seleccionado */
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  availability: AvailabilityFilter;
  onAvailabilityChange: (value: AvailabilityFilter) => void;
  /* Lista de tallas disponibles, calculada a partir de los productos visibles */
  sizes: string[];
  selectedSize: string | null;
  onSizeChange: (size: string | null) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

/*
Ícono de flecha de los filtors
*/
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/*
Dropdown genérico y reutilizable.
Se cierra automáticamente si el usuario hace clic fuera del componente.
 */
function FilterDropdown({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  // Controla si el panel del dropdown está visible o no
  const [open, setOpen] = useState(false);
  // Referencia al contenedor, usada para detectar clics fuera del dropdown
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Si el clic ocurre fuera de este dropdown, se cierra
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm text-black hover:opacity-70"
      >
        {label}
        <ChevronIcon open={open} />
      </button>

      {/* Panel flotante con el contenido del filtro */}
      {open && (
        <div className="absolute left-0 z-20 mt-2 w-64 rounded-md border border-gray-200 bg-white p-4 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

/**
Barra de filtros y ordenamiento del catálogo.
Renderiza tres filtros (Precio, Disponibilidad, Talla del calzado).
*/
export default function FilterBar({
  totalCount,
  priceBounds,
  priceRange,
  onPriceRangeChange,
  availability,
  onAvailabilityChange,
  sizes,
  selectedSize,
  onSizeChange,
  sortBy,
  onSortChange,
}: FilterBarProps) {
  // Valores "borrador" de precio mínimo/máximo mientras el usuario escribe,
  // antes de confirmar con el botón "Aplicar".
  const [minDraft, setMinDraft] = useState(priceRange[0]);
  const [maxDraft, setMaxDraft] = useState(priceRange[1]);

  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Bloque izquierdo: filtros */}
      <div className="flex flex-wrap items-center gap-6">
        <span className="text-sm text-gray-500">Filtrar:</span>
        {/* Filtro de precio*/}
        <FilterDropdown label="Precio">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-1 rounded border border-gray-300 px-2 py-1">
                <span className="text-xs text-gray-500">$</span>
                <input
                  type="number"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  value={minDraft}
                  onChange={(e) => setMinDraft(Number(e.target.value))}
                  className="w-full text-sm outline-none"
                />
              </div>
              <span className="text-gray-400">a</span>
              <div className="flex flex-1 items-center gap-1 rounded border border-gray-300 px-2 py-1">
                <span className="text-xs text-gray-500">$</span>
                <input
                  type="number"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  value={maxDraft}
                  onChange={(e) => setMaxDraft(Number(e.target.value))}
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>
            {/* Al confirmar, se envía el rango borrador hacia el componente padre */}
            <button
              type="button"
              onClick={() => onPriceRangeChange([minDraft, maxDraft])}
              className="w-full bg-black py-2 text-xs font-semibold uppercase text-white hover:bg-gray-800"
            >
              Aplicar
            </button>
          </div>
        </FilterDropdown>
        {/* Filtro de disponibilidad*/}
        <FilterDropdown label="Disponibilidad">
          <div className="flex flex-col gap-2 text-sm">
            {AVAILABILITY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="radio"
                  name="availability"
                  checked={availability === opt.value}
                  onChange={() => onAvailabilityChange(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </FilterDropdown>
        {/* Filtro de talla*/}
        <FilterDropdown label="Talla del calzado">
          <div className="flex max-h-48 flex-col gap-2 overflow-y-auto text-sm">
            {/* Opción para quitar el filtro de talla y mostrar todas */}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="size"
                checked={selectedSize === null}
                onChange={() => onSizeChange(null)}
              />
              Todas
            </label>
            {sizes.map((size) => (
              <label key={size} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="size"
                  checked={selectedSize === size}
                  onChange={() => onSizeChange(size)}
                />
                {size}
              </label>
            ))}
          </div>
        </FilterDropdown>
      </div>
      {/* Bloque derecho: orden y contador de resultados */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {/* Pluralizar "producto/productos" según el conteo */}
        <span className="whitespace-nowrap text-sm text-gray-500">
          {totalCount} producto{totalCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}