"use server";

import { login as loginRequest } from "@/lib/auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Completa tu correo y contraseña." };
  }

  const result = await loginRequest(email, password);

  if (!result.success) {
    return { error: result.error };
  }

  // TODO: redirect("/cuenta") una vez conectado el backend real
  return {};
}