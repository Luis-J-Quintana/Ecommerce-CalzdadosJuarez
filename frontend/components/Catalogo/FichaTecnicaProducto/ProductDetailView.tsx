"use client";

import { useState } from "react";
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
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes[0] ?? null
  );

  // Si no hay galería definida (mock viejo), cae de vuelta a image/hoverImage
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
          {product.code} {product.name}
        </h1>
        <p className="mt-2 text-2xl font-bold">
          ${product.price.toFixed(2)} {product.currency ?? "MXN"}
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
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`h-11 w-11 rounded-full border text-sm font-medium transition-colors ${
                  selectedSize === size
                    ? "border-black bg-black text-white"
                    : "border-gray-300 text-black hover:border-black"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        {/* Agregar al carrito */}
        <button
          type="button"
          disabled={!product.inStock}
          className="mt-6 w-full bg-black py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {product.inStock ? "Agregar al carrito" : "Agotado"}
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