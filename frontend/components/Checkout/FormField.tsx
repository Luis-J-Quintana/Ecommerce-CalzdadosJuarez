"use client";

import type { ChangeEvent } from "react";
import InfoTooltip from "./InfoTooltip";

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
  tooltip?: string;
  optional?: boolean;
}

/**
 * Campo de texto con "label flotante": el placeholder funciona como
 * etiqueta y sube/encoge cuando el campo tiene foco o ya tiene texto.
 * Si el campo tiene error, el borde se pinta de rojo y se muestra el
 * mensaje debajo.
 */
export default function FormField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  tooltip,
  optional,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder=" "
          className={`peer w-full rounded-md border px-3 pb-2 pt-7 text-sm outline-none transition-colors ${
            error ? "border-red-500" : "border-gray-300 focus:border-black"
          } ${tooltip ? "pr-10" : ""}`}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 transition-all peer-focus:top-3.5 peer-focus:translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-3.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"
        >
          {label}
          {optional && " (opcional)"}
        </label>

        {tooltip && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <InfoTooltip text={tooltip} />
          </div>
        )}
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}