import Image from "next/image";
import MercadoPagoLogo from "@/icons/MercadoPagoLogo.png";
import CreditCardForm from "./CreditCardForm";
import type {
  AddressFormErrors,
  CreditCardField,
  CreditCardFormValues,
  PaymentMethod,
} from "./types";

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  cardValues: CreditCardFormValues;
  onCardFieldChange: (field: CreditCardField, value: string) => void;
  onUseSameAddressChange: (value: boolean) => void;
  billingErrors: AddressFormErrors;
  onBillingChange: (field: keyof CreditCardFormValues["billingData"], value: string) => void;
}

/**
 * Métodos de pago disponibles: Mercado Pago y Tarjeta de crédito.
 * Al seleccionar
 * "Tarjeta de crédito" se despliega CreditCardForm justo debajo.
 */
export default function PaymentMethodSelector({
  value,
  onChange,
  cardValues,
  onCardFieldChange,
  onUseSameAddressChange,
  billingErrors,
  onBillingChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Mercado Pago */}
      <div
        className={`rounded-md border ${
          value === "mercado-pago" ? "border-black" : "border-gray-300"
        }`}
      >
        <label className="flex cursor-pointer items-center justify-between gap-3 p-4">
          <span className="flex items-center gap-3">
            <input
              type="radio"
              name="payment-method"
              checked={value === "mercado-pago"}
              onChange={() => onChange("mercado-pago")}
            />
            <span className="text-sm font-medium">Mercado Pago</span>
          </span>
          <Image src={MercadoPagoLogo} alt="Mercado Pago" className="h-5 w-auto" />
        </label>

        {value === "mercado-pago" && (
          <p className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
            Se te redirigirá a Mercado Pago para que completes la compra.
          </p>
        )}
      </div>

      {/* Tarjeta de crédito */}
      <div
        className={`rounded-md border ${
          value === "tarjeta" ? "border-black" : "border-gray-300"
        }`}
      >
        <label className="flex cursor-pointer items-center justify-between gap-3 p-4">
          <span className="flex items-center gap-3">
            <input
              type="radio"
              name="payment-method"
              checked={value === "tarjeta"}
              onChange={() => onChange("tarjeta")}
            />
            <span className="text-sm font-medium">Tarjeta de crédito</span>
          </span>
          <span className="flex items-center gap-1">
            {["VISA", "MC", "AMEX"].map((brand) => (
              <span
                key={brand}
                className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600"
              >
                {brand}
              </span>
            ))}
          </span>
        </label>

        {value === "tarjeta" && (
          <CreditCardForm
            values={cardValues}
            onFieldChange={onCardFieldChange}
            onUseSameAddressChange={onUseSameAddressChange}
            billingErrors={billingErrors}
            onBillingChange={onBillingChange}
          />
        )}
      </div>
    </div>
  );
}