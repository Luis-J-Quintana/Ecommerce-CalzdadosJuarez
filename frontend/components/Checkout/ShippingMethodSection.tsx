/**
 * Sección "Métodos de envío". Mientras no se conozca la dirección de
 * envío del usuario, no hay tarifas que mostrar, así que se muestra
 * un aviso. Cuando se integre el cálculo real de envío, aquí se
 * renderizaría la lista de opciones disponibles (estándar, exprés, etc.).
 */
export default function ShippingMethodSection() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Métodos de envío</h2>
      <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-400">
        Ingresa tu dirección de envío para ver los métodos disponibles.
      </div>
    </section>
  );
}