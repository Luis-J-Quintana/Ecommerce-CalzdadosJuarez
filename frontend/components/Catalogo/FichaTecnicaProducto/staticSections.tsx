// Contenido estático reutilizado en todos los productos.
// Usado en la vista de detalle de producto

const SIZE_GUIDE: { us: string; mx: string }[] = [
  { us: "5", mx: "22" },
  { us: "5.5", mx: "22" },
  { us: "6", mx: "23" },
  { us: "6.5", mx: "23" },
  { us: "7", mx: "24" },
  { us: "7.5", mx: "24" },
  { us: "8", mx: "25" },
  { us: "8.5", mx: "25" },
  { us: "9", mx: "26" },
  { us: "9.5", mx: "26" },
  { us: "10", mx: "27" },
];

export function SizeGuideContent() {
  return (
    <div>
      <p>
        Encuentra la talla perfecta para tus zapatos siguiendo esta guía:
        <br />
        Si no encuentras medios números,{" "}
        <span className="font-bold">elige siempre la talla entera</span> (por
        ejemplo, si calzas 25.5 cm, selecciona la talla 25).
      </p>

      <table className="mt-4 w-full max-w-xs border border-gray-300 text-center">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="border-r border-gray-300 py-2 text-xs font-bold uppercase">
              Tallas US
            </th>
            <th className="py-2 text-xs font-bold uppercase">Tallas MX (cm)</th>
          </tr>
        </thead>
        <tbody>
          {SIZE_GUIDE.map((row) => (
            <tr key={row.us} className="border-b border-gray-200 last:border-b-0">
              <td className="border-r border-gray-300 py-2">{row.us}</td>
              <td className="py-2">{row.mx}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ShippingReturnsContent() {
  return (
    <div className="flex flex-col gap-3">
      <p>
        Tiempo de entrega: <span className="font-bold">3 a 7 días hábiles.</span>
      </p>
      <p>
        En temporada alta, el envío podría tomar un poco más debido a la alta
        demanda en las paqueterías.
      </p>

      <div>
        <p className="font-bold">Costos de envío:</p>
        <p>$0 - $799: Envío $179 MXN</p>
        <p>$800 - $1399: Envío $249 MXN</p>
        <p>$1400 - en adelante: Envío $320 MXN</p>
      </div>

      <div>
        <p className="font-bold">Devoluciones:</p>
        <p>Ofrecemos una política de cambios de 30 días.</p>
        <p>El producto debe estar en perfecto estado y sin uso.</p>
        <p>Los cambios aplican por defectos de fábrica o si la talla no fue la correcta.</p>
      </div>

      <p>
        <span className="font-bold">¿Cómo solicitar un cambio?</span> Escríbenos
        con tu número de pedido y el motivo. Te guiaremos en el proceso.
      </p>
    </div>
  );
}