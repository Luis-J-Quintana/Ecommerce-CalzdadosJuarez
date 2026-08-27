"use client";

import { useState } from "react";
import FormField from "./FormField";

/**
 * Sección "Contacto": únicamente el correo electrónico, con un tooltip
 * explicando para qué se usa.
 */
export default function ContactSection() {
  const [email, setEmail] = useState("");

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Contacto</h2>
        <a href="#" className="text-sm underline">
          Iniciar sesión
        </a>
      </div>

      <FormField
        id="email"
        label="Correo electrónico"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        tooltip="Se usa para la confirmación del pedido y los recordatorios del carrito"
      />
    </section>
  );
}