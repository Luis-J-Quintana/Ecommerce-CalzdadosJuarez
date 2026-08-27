"use client";

import type { ChangeEvent } from "react";

interface FormSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  error?: string;
}

export default function FormSelect({
  id,
  label,
  value,
  onChange,
  options,
  error,
}: FormSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={`w-full appearance-none rounded-md border bg-white px-3 pb-1.5 pt-6 text-sm outline-none transition-colors ${
            error ? "border-red-500" : "border-gray-300 focus:border-black"
          }`}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        <label
          htmlFor={id}
          className="pointer-events-none absolute left-3 top-2 text-xs text-gray-500"
        >
          {label}
        </label>

        {/* Flecha menú desplegable */}
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}