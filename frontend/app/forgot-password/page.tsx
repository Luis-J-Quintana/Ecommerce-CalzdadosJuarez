import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Restablecer contraseña — Calzados Juárez",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}