"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { loginAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="flex flex-col items-center px-6 py-18">
      <h1 className="mb-8 text-4xl font-black tracking-tight">Inicio de sesión</h1>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <button
          type="button"
          onClick={() => {
            // TODO: iniciar flujo OAuth de Google cuando Medusa lo tenga configurado
          }}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 py-3 font-semibold transition-colors hover:bg-gray-50"
        >
          <FcGoogle size={20} />
          Iniciar sesión con Google
        </button>

        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          o
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <form action={formAction} className="flex flex-col gap-4">
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
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
          />

          <Link href="/olvide-password" className="-mt-1 self-start text-sm underline">
            ¿Olvidaste tu contraseña?
          </Link>

          {state.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-black py-3 font-bold uppercase tracking-wide text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
          >
            {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <Link href="/registro" className="text-center text-sm underline">
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}