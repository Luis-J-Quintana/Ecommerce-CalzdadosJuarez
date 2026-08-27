"use client";

import AddressFields from "./AddressFields";
import type { AddressFormData, AddressFormErrors } from "./types";

interface DeliverySectionProps {
  data: AddressFormData;
  errors: AddressFormErrors;
  onChange: (field: keyof AddressFormData, value: string) => void;
  saveInfo: boolean;
  onSaveInfoChange: (value: boolean) => void;
}

/**
 * Sección "Entrega": dirección de envío. El estado y la validación
 * viven en CheckoutForm (componente padre) y llegan aquí por props,
 * para que al enviar el formulario se puedan validar todos los campos
 * desde un solo lugar.
 */
export default function DeliverySection({
  data,
  errors,
  onChange,
  saveInfo,
  onSaveInfoChange,
}: DeliverySectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Entrega</h2>

      <AddressFields
        idPrefix="entrega"
        data={data}
        errors={errors}
        onChange={onChange}
        telefonoTooltip="En caso de que tengamos que contactarte sobre tu pedido."
      />

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={saveInfo}
          onChange={(e) => onSaveInfoChange(e.target.checked)}
          className="h-4 w-4"
        />
        Guardar mi información y consultar más rápidamente la próxima vez
      </label>
    </section>
  );
}