// lib/auth.ts
export type AuthResult =
  | { success: true; customer: { id: string; email: string; firstName: string } }
  | { success: false; error: string };

export async function login(email: string, password: string): Promise<AuthResult> {
  // TODO: reemplazar por fetch a `${MEDUSA_BACKEND_URL}/store/auth`
  // con credentials: "include" para que Medusa setee la cookie de sesión
  return { success: false, error: "Auth aún no conectado al backend" };
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<AuthResult> {
  // TODO: reemplazar por fetch a `${MEDUSA_BACKEND_URL}/store/customers`
  return { success: false, error: "Auth aún no conectado al backend" };
}

export async function getCurrentCustomer() {
  // TODO: reemplazar por fetch a `${MEDUSA_BACKEND_URL}/store/customers/me`
  return null;
}