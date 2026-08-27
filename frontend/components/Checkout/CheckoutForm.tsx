"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import ContactSection from "./ContactSection";
import DeliverySection from "./DeliverySection";
import ShippingMethodSection from "./ShippingMethodSection";
import PaymentMethodSelector from "./PaymentMethodSelector";
import type {
  AddressFormData,
  AddressFormErrors,
  CreditCardField,
  CreditCardFormValues,
  PaymentMethod,
} from "./types";

const FOOTER_LINKS = [
  { label: "Política de reembolso", href: "#" },
  { label: "Envío", href: "#" },
  { label: "Política de privacidad", href: "#" },
  { label: "Términos del servicio", href: "#" },
];

const EMPTY_ADDRESS: AddressFormData = {
  nombre: "",
  apellidos: "",
  direccion: "",
  casaDepto: "",
  codigoPostal: "",
  ciudad: "",
  estado: "Quintana Roo",
  telefono: "",
};

/**
 * Revisa los campos obligatorios de una dirección y regresa un objeto
 * con el mensaje de error correspondiente a cada campo vacío.
 * País, Estado y "Casa/apartamento" no son obligatorios.
 */
function validateAddress(data: AddressFormData): AddressFormErrors {
  const errors: AddressFormErrors = {};
  if (!data.nombre.trim()) errors.nombre = "Introduce un nombre";
  if (!data.apellidos.trim()) errors.apellidos = "Introduce un apellido";
  if (!data.direccion.trim()) errors.direccion = "Introduce una dirección";
  if (!data.codigoPostal.trim()) errors.codigoPostal = "Introduce la zona o código postal";
  if (!data.ciudad.trim()) errors.ciudad = "Introduce la ciudad";
  return errors;
}

/**
 * Formulario del checkout (columna izquierda). Centraliza el estado de
 * la dirección de entrega, del método de pago y (si aplica) de la
 * tarjeta + dirección de facturación, para poder validar todo junto al
 * enviar el formulario.
 */
export default function CheckoutForm() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mercado-pago");

  // --- Dirección de entrega ---
  const [deliveryData, setDeliveryData] = useState<AddressFormData>(EMPTY_ADDRESS);
  const [deliveryErrors, setDeliveryErrors] = useState<AddressFormErrors>({});
  const [saveInfo, setSaveInfo] = useState(false);

  function handleDeliveryChange(field: keyof AddressFormData, value: string) {
    setDeliveryData((prev) => ({ ...prev, [field]: value }));
    // Limpia el error de ese campo específico en cuanto el usuario empieza a corregirlo
    setDeliveryErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  // --- Tarjeta de crédito + dirección de facturación ---
  const [cardValues, setCardValues] = useState<CreditCardFormValues>({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardholder: "",
    months: "",
    useSameAddress: true,
    billingData: EMPTY_ADDRESS,
  });
  const [billingErrors, setBillingErrors] = useState<AddressFormErrors>({});

  function handleCardFieldChange(field: CreditCardField, value: string) {
    setCardValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleUseSameAddressChange(value: boolean) {
    setCardValues((prev) => ({ ...prev, useSameAddress: value }));
    if (value) setBillingErrors({});
  }

  function handleBillingChange(field: keyof AddressFormData, value: string) {
    setCardValues((prev) => ({
      ...prev,
      billingData: { ...prev.billingData, [field]: value },
    }));
    setBillingErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newDeliveryErrors = validateAddress(deliveryData);
    setDeliveryErrors(newDeliveryErrors);

    // La dirección de facturación solo se valida si el método es tarjeta
    // Y el usuario eligió capturar una dirección distinta a la de envío
    let newBillingErrors: AddressFormErrors = {};
    if (paymentMethod === "tarjeta" && !cardValues.useSameAddress) {
      newBillingErrors = validateAddress(cardValues.billingData);
      setBillingErrors(newBillingErrors);
    } else {
      setBillingErrors({});
    }

    const hasErrors =
      Object.values(newDeliveryErrors).some(Boolean) ||
      Object.values(newBillingErrors).some(Boolean);

    if (hasErrors) return;

    // TODO: conectar con la pasarela de pago real (Stripe/Mercado Pago)
    // según "paymentMethod", enviando deliveryData, cardValues, etc.
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-8 px-6 pb-8 pt-14 sm:px-10 lg:px-16"
    >
      <ContactSection />

      <DeliverySection
        data={deliveryData}
        errors={deliveryErrors}
        onChange={handleDeliveryChange}
        saveInfo={saveInfo}
        onSaveInfoChange={setSaveInfo}
      />

      <ShippingMethodSection />

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pago</h2>
          <p className="text-sm text-gray-500">
            Todas las transacciones son seguras y están encriptadas.
          </p>
        </div>
        <PaymentMethodSelector
          value={paymentMethod}
          onChange={setPaymentMethod}
          cardValues={cardValues}
          onCardFieldChange={handleCardFieldChange}
          onUseSameAddressChange={handleUseSameAddressChange}
          billingErrors={billingErrors}
          onBillingChange={handleBillingChange}
        />
      </section>

      <button
        type="submit"
        className="w-full bg-black py-4 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gray-800"
      >
        Pagar ahora
      </button>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
        {FOOTER_LINKS.map((link) => (
          <Link key={link.label} href={link.href} className="hover:underline">
            {link.label}
          </Link>
        ))}
      </div>
    </form>
  );
}