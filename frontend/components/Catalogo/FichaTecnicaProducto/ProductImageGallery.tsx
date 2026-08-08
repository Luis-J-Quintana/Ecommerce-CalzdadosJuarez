"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
}

/**
 * Grid de imagenes del producto.
 * Al hacer click se abre un modal para ver la imagen.
 */
export default function ProductImageGallery({ images, alt }: ProductImageGalleryProps) {
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  const isOpen = zoomIndex !== null;

  // Cierra el modal y se puede navegar con las flechas
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomIndex(null);
      if (e.key === "ArrowRight") {
        setZoomIndex((prev) => (prev === null ? null : (prev + 1) % images.length));
      }
      if (e.key === "ArrowLeft") {
        setZoomIndex((prev) =>
          prev === null ? null : (prev - 1 + images.length) % images.length
        );
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    // Bloquea el scroll de fondo mientras el modal está abierto
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, images.length]);

  return (
    <>
      {/* Grid 2x2 */}
      <div className="grid grid-cols-2 gap-2">
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setZoomIndex(i)}
            className="group relative aspect-3/4 w-full cursor-zoom-in overflow-hidden rounded-2xl bg-gray-100"
            aria-label={`Ampliar imagen ${i + 1} de ${images.length}`}
          >
            <Image
              src={src}
              alt={`${alt} - imagen ${i + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {/* Modal de zoom */}
      {isOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomIndex(null)}
        >
          {/* Botón cerrar */}
          <button
            type="button"
            onClick={() => setZoomIndex(null)}
            className="absolute right-4 top-4 text-3xl font-light text-white hover:opacity-70"
            aria-label="Cerrar"
          >
            ×
          </button>

          {/* Flecha izquierda */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomIndex((prev) =>
                  prev === null ? null : (prev - 1 + images.length) % images.length
                );
              }}
              className="absolute left-4 text-4xl font-light text-white hover:opacity-70"
              aria-label="Imagen anterior"
            >
              ‹
            </button>
          )}

          {/* Imagen ampliada */}
          <div
            className="relative h-[85vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[zoomIndex]}
              alt={`${alt} - imagen ${zoomIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {/* Flecha derecha */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomIndex((prev) => (prev === null ? null : (prev + 1) % images.length));
              }}
              className="absolute right-4 text-4xl font-light text-white hover:opacity-70"
              aria-label="Imagen siguiente"
            >
              ›
            </button>
          )}

          {/* Contador */}
          <span className="absolute bottom-4 text-sm text-white/80">
            {zoomIndex + 1} / {images.length}
          </span>
        </div>
      )}
    </>
  );
}