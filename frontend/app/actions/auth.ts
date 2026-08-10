"use server";

import {
  login as loginRequest,
  register as registerRequest,
  requestPasswordReset as requestPasswordResetRequest,
} from "@/lib/auth";

export type LoginState = { error?: string };
export type RegisterState = { error?: string };
export type ForgotPasswordState = { error?: string; sent?: boolean };

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
  if (!result.success) return { error: result.error };

  // TODO: redirect("/cuenta") una vez conectado el backend real
  return {};
}

export async function registerAction(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!firstName || !lastName || !email || !password) {
    return { error: "Completa todos los campos." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const result = await registerRequest({ firstName, lastName, email, password });
  if (!result.success) return { error: result.error };

  // TODO: redirect("/cuenta") una vez conectado el backend real
  return {};
}

export async function forgotPasswordAction(
  prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Ingresa tu correo electrónico." };
  }

  const result = await requestPasswordResetRequest(email);
  if (!result.success) return { error: result.error };

  return { sent: true };
}