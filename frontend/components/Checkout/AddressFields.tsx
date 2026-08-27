"use client";

import FormField from "./FormField";
import FormSelect from "./FormSelect";
import { MEXICAN_STATES } from "./mexicanStates";
import type { AddressFormData, AddressFormErrors } from "./types";

interface AddressFieldsProps {
  /** Prefijo para los "id" de los inputs, para que no se repitan entre Entrega y Facturación */
  idPrefix: string;
  data: AddressFormData;
  errors: AddressFormErrors;
  onChange: (field: keyof AddressFormData, value: string) => void;
  telefonoOptional?: boolean;
  telefonoTooltip?: string;
}

/**
 * Conjunto de campos de una dirección postal completa. Se usa tanto en la sección "Entrega" como dentro del
 * formulario de tarjeta para "Dirección de facturación", para no
 * duplicar el mismo bloque de inputs dos veces.
 */
export default function AddressFields({
  idPrefix,
  data,
  errors,
  onChange,
  telefonoOptional,
  telefonoTooltip,
}: AddressFieldsProps) {
  return (
    <>
      {/* Por ahora solo hay una opción de país; si más adelante venden
          fuera de México, aquí se agregaría más opciones y estado real */}
      <FormSelect
        id={`${idPrefix}-pais`}
        label="País / Región"
        value="México"
        onChange={() => {}}
        options={["México"]}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          id={`${idPrefix}-nombre`}
          label="Nombre"
          value={data.nombre}
          onChange={(e) => onChange("nombre", e.target.value)}
          error={errors.nombre}
        />
        <FormField
          id={`${idPrefix}-apellidos`}
          label="Apellidos"
          value={data.apellidos}
          onChange={(e) => onChange("apellidos", e.target.value)}
          error={errors.apellidos}
        />
      </div>

      <FormField
        id={`${idPrefix}-direccion`}
        label="Dirección"
        value={data.direccion}
        onChange={(e) => onChange("direccion", e.target.value)}
        error={errors.direccion}
      />

      <FormField
        id={`${idPrefix}-casaDepto`}
        label="Casa, apartamento, etc."
        optional
        value={data.casaDepto}
        onChange={(e) => onChange("casaDepto", e.target.value)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField
          id={`${idPrefix}-codigoPostal`}
          label="Código postal"
          value={data.codigoPostal}
          onChange={(e) => onChange("codigoPostal", e.target.value)}
          error={errors.codigoPostal}
        />
        <FormField
          id={`${idPrefix}-ciudad`}
          label="Ciudad"
          value={data.ciudad}
          onChange={(e) => onChange("ciudad", e.target.value)}
          error={errors.ciudad}
        />
        <FormSelect
          id={`${idPrefix}-estado`}
          label="Estado"
          value={data.estado}
          onChange={(e) => onChange("estado", e.target.value)}
          options={MEXICAN_STATES}
        />
      </div>

      <FormField
        id={`${idPrefix}-telefono`}
        label="Teléfono"
        type="tel"
        optional={telefonoOptional}
        value={data.telefono}
        onChange={(e) => onChange("telefono", e.target.value)}
        tooltip={telefonoTooltip}
      />
    </>
  );
}