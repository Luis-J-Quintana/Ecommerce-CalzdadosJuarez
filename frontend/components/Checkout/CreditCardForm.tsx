"use client";

import FormField from "./FormField";
import AddressFields from "./AddressFields";
import type { AddressFormErrors, CreditCardField, CreditCardFormValues } from "./types";

// TODO: Checar si habrá meses sin intereses
const MONTH_OPTIONS = ["1", "3", "6", "12"];

interface CreditCardFormProps {
  values: CreditCardFormValues;
  onFieldChange: (field: CreditCardField, value: string) => void;
  onUseSameAddressChange: (value: boolean) => void;
  billingErrors: AddressFormErrors;
  onBillingChange: (field: keyof CreditCardFormValues["billingData"], value: string) => void;
}

/**
 * Formulario que se despliega debajo de "Tarjeta de crédito".
 */
export default function CreditCardForm({
  values,
  onFieldChange,
  onUseSameAddressChange,
  billingErrors,
  onBillingChange,
}: CreditCardFormProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 p-4">
      <FormField
        id="card-number"
        label="Número de tarjeta"
        value={values.cardNumber}
        onChange={(e) => onFieldChange("cardNumber", e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="card-expiry"
          label="Fecha de vencimiento (MM / AA)"
          value={values.expiry}
          onChange={(e) => onFieldChange("expiry", e.target.value)}
        />
        <FormField
          id="card-cvv"
          label="Código de seguridad"
          value={values.cvv}
          onChange={(e) => onFieldChange("cvv", e.target.value)}
          tooltip="Los 3 dígitos que aparecen al reverso de tu tarjeta"
        />
      </div>

      <FormField
        id="card-holder"
        label="Nombre del titular como aparece en la tarjeta"
        value={values.cardholder}
        onChange={(e) => onFieldChange("cardholder", e.target.value)}
      />

      <select
        value={values.months}
        onChange={(e) => onFieldChange("months", e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-black"
      >
        <option value="">Meses</option>
        {MONTH_OPTIONS.map((m) => (
          <option key={m} value={m}>
            {m} {m === "1" ? "mes" : "meses"}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={values.useSameAddress}
          onChange={(e) => onUseSameAddressChange(e.target.checked)}
          className="h-4 w-4"
        />
        Usar la dirección de envío como dirección de facturación
      </label>

      {/* Solo se pide una dirección de facturación distinta si el usuario
          desmarcó la casilla de arriba */}
      {!values.useSameAddress && (
        <div className="flex flex-col gap-4 border-t border-gray-200 pt-4">
          <h3 className="text-base font-semibold">Dirección de facturación</h3>
          <AddressFields
            idPrefix="facturacion"
            data={values.billingData}
            errors={billingErrors}
            onChange={onBillingChange}
            telefonoOptional
          />
        </div>
      )}
    </div>
  );
}