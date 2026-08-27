export type AuthResult =
  | { success: true; customer: { id: string; email: string } }
  | { success: false; error: string };

export type ForgotPasswordResult =
  | { success: true }
  | { success: false; error: string };

export async function login(email: string, password: string): Promise<AuthResult> {
  // TODO: reemplazar por fetch a `${MEDUSA_BACKEND_URL}/store/auth`
  // con credentials: "include" para que Medusa setee la cookie de sesión
  return { success: false, error: "Auth aún no conectado al backend" };
}

export async function register(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  // TODO: reemplazar por fetch a `${MEDUSA_BACKEND_URL}/store/customers`
  return { success: false, error: "Auth aún no conectado al backend" };
}

export async function requestPasswordReset(email: string): Promise<ForgotPasswordResult> {
  // TODO: reemplazar por fetch a `${MEDUSA_BACKEND_URL}/store/customers/password-token`
  return { success: false, error: "Auth aún no conectado al backend" };
}