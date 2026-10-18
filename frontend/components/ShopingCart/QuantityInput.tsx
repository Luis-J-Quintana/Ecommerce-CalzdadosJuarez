"use client";

import { useRef, useState, type KeyboardEvent } from "react";

type QuantityInputProps = {
  /** Cantidad confirmada (la del carrito). */
  value: number;
  /** Nombre del producto, para el aria-label. */
  name: string;
  max: number;
  onDecrease: () => void;
  onIncrease: () => void;
  /** Se llama solo al confirmar (blur o Enter) con una cantidad válida y distinta. */
  onCommit: (quantity: number) => void;
  size?: "sm" | "xs";
};

/**
 * Control de cantidad: botones - y + con un campo de texto numérico en medio.
 * - Solo admite dígitos (también al pegar).
 * - Mientras se edita, el campo puede quedar vacío y no lo pisan las respuestas
 *   del servidor; se confirma en blur o Enter, y Escape cancela.
 * - Vacío o 0 restaura la cantidad anterior; eliminar es solo con el botón de quitar.
 * - Por encima del máximo, se ajusta al máximo.
 */
export default function QuantityInput({
  value,
  name,
  max,
  onDecrease,
  onIncrease,
  onCommit,
  size = "sm",
}: QuantityInputProps) {
  // null = sin edición en curso: el campo muestra `value`
  const [draft, setDraft] = useState<string | null>(null);
  // Evita que el blur posterior a Enter/Escape vuelva a confirmar
  const skipBlurRef = useRef(false);

  const commit = () => {
    if (draft === null) return;
    const digits = draft.replace(/\D/g, "");
    const parsed = digits === "" ? 0 : parseInt(digits, 10);
    setDraft(null);
    if (!parsed) return; // vacío o 0: se restaura la cantidad anterior
    const next = Math.min(parsed, max);
    if (next !== value) onCommit(next);
  };

  const cancel = () => setDraft(null);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
      skipBlurRef.current = true;
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
      skipBlurRef.current = true;
      e.currentTarget.blur();
    }
  };

  const onBlur = () => {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    commit();
  };

  const button =
    size === "xs"
      ? "flex h-5 w-5 items-center justify-center text-gray-500 hover:text-black"
      : "flex h-6 w-6 items-center justify-center text-gray-500 hover:text-black";

  return (
    <div
      className={`flex items-center gap-1 border border-gray-200 w-fit ${
        size === "xs" ? "rounded-md text-xs" : "rounded-lg text-sm"
      }`}
    >
      <button
        type="button"
        onClick={onDecrease}
        className={button}
        aria-label={`Disminuir cantidad de ${name}`}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label={`Cantidad de ${name}`}
        value={draft ?? String(value)}
        onFocus={(e) => {
          setDraft(String(value));
          // En el siguiente frame, para que el mouseup del clic no quite la selección
          const input = e.currentTarget;
          requestAnimationFrame(() => input.select());
        }}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className="w-[4.5ch] bg-transparent text-center font-medium tabular-nums outline-none focus:ring-1 focus:ring-gray-300 rounded"
      />
      <button
        type="button"
        onClick={onIncrease}
        className={button}
        aria-label={`Aumentar cantidad de ${name}`}
      >
        +
      </button>
    </div>
  );
}
