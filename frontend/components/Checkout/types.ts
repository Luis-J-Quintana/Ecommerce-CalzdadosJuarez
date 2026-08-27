export type PaymentMethod = "mercado-pago" | "tarjeta";

export interface AddressFormData {
  nombre: string;
  apellidos: string;
  direccion: string;
  casaDepto: string;
  codigoPostal: string;
  ciudad: string;
  estado: string;
  telefono: string;
}

/** Un mensaje de error por cada campo de AddressFormData que falle la validación */
export type AddressFormErrors = Partial<Record<keyof AddressFormData, string>>;

export type CreditCardField =
  | "cardNumber"
  | "expiry"
  | "cvv"
  | "cardholder"
  | "months";

export interface CreditCardFormValues {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholder: string;
  months: string;
  /** true = usar la misma dirección de envío como facturación (oculta el bloque de abajo) */
  useSameAddress: boolean;
  billingData: AddressFormData;
}