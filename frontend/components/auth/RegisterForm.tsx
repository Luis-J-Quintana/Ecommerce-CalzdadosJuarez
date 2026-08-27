"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "@/app/actions/auth";

const initialState: RegisterState = {};

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <div className="flex flex-col items-center px-6 py-18">
      <h1 className="mb-8 text-4xl font-black tracking-tight">Crear cuenta</h1>

      <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
        <input
          id="firstName"
          name="firstName"
          type="text"
          placeholder="Nombre"
          autoComplete="given-name"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
        />

        <input
          id="lastName"
          name="lastName"
          type="text"
          placeholder="Apellido"
          autoComplete="family-name"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
        />

        <input
          id="email"
          name="email"
          type="email"
          placeholder="Correo electrónico"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
        />

        <input
          id="password"
          name="password"
          type="password"
          placeholder="Contraseña"
          autoComplete="new-password"
          minLength={8}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
        />

        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 self-center rounded-lg bg-black px-10 py-3 font-bold uppercase tracking-wide text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
        >
          {isPending ? "Creando..." : "Crear"}
        </button>

        <Link href="/login" className="text-center text-sm underline">
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
      </form>
    </div>
  );
}