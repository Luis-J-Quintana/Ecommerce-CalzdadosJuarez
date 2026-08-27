import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Inicio de sesión — Calzados Juárez",
};

export default function LoginPage() {
  return <LoginForm />;
}