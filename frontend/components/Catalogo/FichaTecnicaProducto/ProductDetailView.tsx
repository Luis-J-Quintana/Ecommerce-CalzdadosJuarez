"use client";

import { useMemo, useState } from "react";
import type { Product } from "../types";
import ProductImageGallery from "./ProductImageGallery";
import AccordionSection from "./AccordionSection";
import { SizeGuideContent, ShippingReturnsContent } from "./staticSections";

interface ProductDetailViewProps {
  product: Product;
}

/**
 * Vista de detalle de producto
 */
export default function ProductDetailView({ product }: ProductDetailViewProps) {
  // Variantes ordenadas por talla
  const variants = useMemo(
    () =>
      [...product.variants].sort((a, b) =>
        a.talla.localeCompare(b.talla, undefined, { numeric: true })
      ),
    [product.variants]
  );

  // Talla inicial: la primera que tenga existencias (o la primera si todas están agotadas)
  const [selectedSize, setSelectedSize] = useState<string | null>(
    (variants.find((v) => v.inStock) ?? variants[0])?.talla ?? null
  );

  const selectedVariant = variants.find((v) => v.talla === selectedSize);

  // Precio de la variante elegida; si no hay, el precio "desde" del producto
  const displayPrice = selectedVariant?.precio || product.price;
  const canBuy = !!selectedVariant && selectedVariant.inStock;

  // Si no hay galería definida, cae de vuelta a image/hoverImage
  const images =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [product.image, product.hoverImage].filter((src): src is string => Boolean(src));

  return (
    <div className="grid grid-cols-1 gap-10 px-6 pb-8 pt-8 sm:px-8 lg:grid-cols-2 lg:px-12">
      {/* Galería de imágenes */}
      <ProductImageGallery images={images} alt={product.name} />
      {/* Info del producto */}
      <div>
        <h1 className="text-3xl font-black">
          {[product.code, product.name].filter(Boolean).join(" ")}
        </h1>
        <p className="mt-2 text-2xl font-bold">
          ${displayPrice.toFixed(2)} {product.currency ?? "MXN"}
        </p>
        {/* Precio de mayoreo*/}
        <p className="mt-1 text-sm text-gray-700">
          A partir de {product.cantMinMayoreo} pares:{" "}
          <span className="font-bold">${product.precioMayoreo.toFixed(2)}</span> c/u
        </p>
        <p className="mt-1 text-xs text-gray-500">
          * Aplica combinando cualquier modelo o talla de la tienda.
        </p>
        {/* Selector de talla */}
        <div className="mt-6">
          <p className="text-sm font-semibold">
            Talla del calzado{selectedSize ? `: ${selectedSize}` : ""}
            {selectedVariant && !selectedVariant.inStock && (
              <span className="ml-2 font-normal text-red-600">Agotada</span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((v) => {
              const isSelected = selectedSize === v.talla;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedSize(v.talla)}
                  aria-disabled={!v.inStock}
                  title={v.inStock ? undefined : "Talla agotada"}
                  className={`h-11 w-11 rounded-full border text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : v.inStock
                        ? "border-gray-300 text-black hover:border-black"
                        : "border-gray-200 text-gray-300 line-through hover:border-gray-300"
                  } ${!v.inStock && isSelected ? "bg-gray-400 border-gray-400" : ""}`}
                >
                  {v.talla}
                </button>
              );
            })}
          </div>
        </div>
        {/* Agregar al carrito */}
        <button
          type="button"
          disabled={!canBuy}
          data-variant-id={selectedVariant?.id}
          className="mt-6 w-full bg-black py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {canBuy ? "Agregar al carrito" : "Agotado"}
        </button>
        {/* Desplegables */}
        <div className="mt-8">
          <AccordionSection title="Descripción" defaultOpen>
            {product.descripcion ? (
              <p>{product.descripcion}</p>
            ) : (
              <p className="text-gray-400">Descripción no disponible.</p>
            )}
          </AccordionSection>

          <AccordionSection title="Guía de tallas">
            <SizeGuideContent />
          </AccordionSection>

          <AccordionSection title="Material">
            {product.material ? (
              <p>{product.material}</p>
            ) : (
              <p className="text-gray-400">Material no disponible.</p>
            )}
          </AccordionSection>

          <AccordionSection title="Envíos y Devoluciones">
            <ShippingReturnsContent />
          </AccordionSection>
        </div>
      </div>
    </div>
  );
}