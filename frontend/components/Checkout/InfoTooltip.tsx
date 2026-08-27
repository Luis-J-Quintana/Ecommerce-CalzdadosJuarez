"use client";

interface InfoTooltipProps {
  text: string;
}

/**
 * Ícono circular "?". Al pasar el cursor muestra
 * un globo de texto encima.
 */
export default function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Más información"
        className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 text-[10px] text-gray-500 hover:border-gray-600 hover:text-gray-700"
      >
        ?
      </button>

      {/* Globo de texto: oculto por defecto (opacity-0, scale-95), aparece
          con transición al hacer hover sobre el "group" (el span padre) */}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-48 -translate-x-1/2 scale-95 rounded-md bg-black px-3 py-2 text-center text-xs leading-snug text-white opacity-0 shadow-lg transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
        {text}
        {/* Triangulito que apunta hacia el ícono */}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-black" />
      </span>
    </span>
  );
}