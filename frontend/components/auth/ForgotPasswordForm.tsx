"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ForgotPasswordState } from "@/app/actions/auth";

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);

  if (state.sent) {
    return (
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <h1 className="mb-4 text-4xl font-black tracking-tight">Revisa tu correo</h1>
        <p className="max-w-sm text-gray-600">
          Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu
          contraseña.
        </p>
        <Link href="/login" className="mt-8 text-sm underline">
          Volver a inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 py-32 text-center">
      <h1 className="mb-4 text-4xl font-black tracking-tight">Restablecer tu contraseña</h1>
      <p className="mb-8 max-w-sm text-gray-600">
        Te enviaremos un correo electrónico para restablecer tu contraseña
      </p>

      <form action={formAction} className="flex w-full max-w-sm flex-col items-center gap-4">
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Correo electrónico"
          autoComplete="email"
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
          className="mt-2 w-full rounded-lg bg-black py-3 font-bold uppercase tracking-wide text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
        >
          {isPending ? "Enviando..." : "Enviar"}
        </button>

        <Link href="/login" className="text-sm underline">
          Cancelar
        </Link>
      </form>
    </div>
  );
}