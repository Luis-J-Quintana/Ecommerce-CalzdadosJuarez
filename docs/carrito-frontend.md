# Carrito en el frontend

Última actualización: 17 de octubre de 2026

| Sección | Contenido |
|---|---|
| [1. Archivos](#1-archivos) | Qué hace cada pieza |
| [2. Estado local y precio visual](#2-estado-local-y-precio-visual) | Cambios instantáneos |
| [3. Sincronización con debounce](#3-sincronización-con-debounce) | Envío del estado completo |
| [4. Rollback con resync](#4-rollback-con-resync) | Qué pasa si falla |
| [5. QuantityInput](#5-quantityinput) | Reglas de entrada y tope máximo |
| [6. No verificado](#6-no-verificado) | Pendiente de probar |

---

## 1. Archivos

| Archivo | Rol |
|---|---|
| `frontend/lib/cartProducts.ts` | Capa de datos: cookie `cart_id`, `getOrCreateCart`, `syncCart` (PUT `/store/custom/carts/:id/sync`), `fetchServerCart`, mapeo de line items a `CartItem`, `visualPrice` y `toDesiredItems` |
| `frontend/lib/cartContex.tsx` | `CartProvider` y `useCart()`: estado, acciones, debounce, rollback |
| `frontend/components/ShopingCart/QuantityInput.tsx` | Control `−` / campo / `+` reutilizable |
| `frontend/components/ShopingCart/ItemList.tsx` | Línea del carrito lateral (usa `QuantityInput`) |
| `frontend/components/ShopingCart/SideListProducts.tsx` | Panel lateral; pasa las acciones a `ItemList` |
| `frontend/components/Checkout/OrderSummary.tsx` y `OrderSummaryItem.tsx` | Resumen del checkout (usa `QuantityInput` en tamaño `xs`) |
| `frontend/components/ShopingCart/WholesaleProgressBar.tsx` | Barra de progreso hacia el mayoreo (lee `totalPairs` del contexto) |

`CartProvider` envuelve la app en `frontend/app/layout.tsx`.

**Acciones de `useCart()`**: `addItem(variantId, quantity?, productName?)`,
`setQuantity(id, cantidad)`, `increase(id)`, `decrease(id)`, `remove(id)`.
Todas terminan en `setQuantity` (o en el mismo cambio de estado para agregar),
así que pasan por la misma ruta de sincronización.

- `decrease` en cantidad 1 elimina la línea.
- `setQuantity` con 0 o menos elimina la línea; por encima de `maxQuantity` la
  ajusta al máximo.
- `addItem` de una variante que ya está suma a esa línea. Si es nueva, crea una
  **línea provisional** (`id: "pending:<variantId>"`, `pending: true`) que se
  muestra con precio "…" hasta que responde el servidor. `addItem` devuelve
  `true`/`false` cuando termina el envío y muestra el toast.

## 2. Estado local y precio visual

- `items` se guarda en estado de React y en `itemsRef` (copia síncrona, para no
  leer valores viejos al pulsar rápido).
- `totalPairs`, `isWholesale`, `pairsUntilWholesale` y `wholesaleLabel` se
  calculan **localmente** a partir de `items` y del `threshold` del servidor.
- El precio de cada línea expuesta por el contexto es el **precio visual**
  (`visualPrice` en `cartProducts.ts`): `wholesalePrice` si el total local
  alcanza el umbral y la línea tiene mayoreo, y si no `retailPrice` (o
  `unit_price` si el servidor no los mandó). Es la misma regla que aplica el
  backend.

## 3. Sincronización con debounce

- Cada cambio incrementa una versión local y reinicia un temporizador de
  **300 ms** (`SYNC_DEBOUNCE_MS`).
- Al vencer, `flush` envía el **estado completo** (`toDesiredItems`: una entrada
  por variante con su cantidad total) a `PUT /store/custom/carts/:id/sync`.
- Solo hay un envío a la vez. Si hay cambios mientras uno está en curso, al
  terminar se envía otra vez.
- Al responder, el estado del servidor **reemplaza** al local solo si no hubo
  cambios pendientes (misma versión y sin temporizador activo). Así una
  respuesta vieja no pisa lo que el usuario acaba de hacer.

## 4. Rollback con resync

Si el envío falla:

- Si **no** hay cambios más nuevos, se llama a `fetchServerCart`, que lee el
  carrito de Medusa y reenvía sus cantidades actuales a `sync` para traer
  precios por línea. El estado local vuelve a lo que hay en el servidor.
- Si **sí** hay cambios más nuevos, no se hace rollback: el siguiente envío
  manda el estado completo, y como el endpoint es idempotente, corrige también
  lo que haya quedado a medias en el servidor.
- `addItem` muestra "Error al agregar el producto. Intenta nuevamente." y
  devuelve `false`.

Al cargar la página, `getOrCreateCart` usa también `fetchServerCart`. Si el
endpoint de sync falla, cae al carrito "crudo" de Medusa con un cálculo local
del mayoreo (`computeFallbackWholesale`). Si el carrito de la cookie ya no
existe, crea uno nuevo con `NEXT_PUBLIC_MEDUSA_REGION_ID`.

## 5. QuantityInput

Props: `value`, `name`, `max`, `onDecrease`, `onIncrease`, `onCommit`,
`size` (`"sm"` por defecto o `"xs"`).

**Reglas de entrada**

1. Campo `type="text"` con `inputMode="numeric"` y `pattern="[0-9]*"`. En
   `onChange` se aplica `replace(/\D/g, "")`: no admite punto, coma, signo, `e`
   ni espacios, tampoco al pegar.
2. Tiene un estado de edición propio (`draft`). Mientras se escribe, el campo
   puede quedar vacío.
3. Se confirma en **blur** o con **Enter**; **Escape** cancela y restaura el
   valor anterior.
4. Al confirmar:
   - vacío o `0` restaura la cantidad anterior (eliminar es solo con el botón
     de quitar);
   - si supera `max`, se ajusta a `max` (**tope máximo**, por defecto 9999 y
     luego el `max_quantity` que manda el servidor);
   - quita ceros a la izquierda (`"007"` pasa a `7`);
   - solo llama a `onCommit` si la cantidad cambió.
5. Al enfocar selecciona todo el texto. Ancho de `4.5ch` (cabe un número de 4
   dígitos). `aria-label="Cantidad de {nombre}"`; los botones tienen
   `aria-label` "Disminuir/Aumentar cantidad de {nombre}".
6. Mientras hay edición en curso, el campo muestra el borrador y no lo pisan
   las respuestas del servidor; al terminar, vuelve a mostrar `value`.
7. Los botones `−` y `+` llaman a `decrease`/`increase` del contexto, que usan la
   misma ruta (`setQuantity`) que el campo.

## 6. No verificado

- No se probó en navegador al escribir este documento (no se ejecutó build ni
  `next dev`); `tsc --noEmit` pasa sin errores.
- Si un producto recién agregado no existe o no está publicado, el servidor
  responde con error y la línea provisional se quita con el resync. El mensaje
  exacto que devuelve Medusa no está verificado.
