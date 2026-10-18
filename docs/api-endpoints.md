# Referencia de endpoints propios

Última actualización: 18 de octubre de 2026

| Sección | Contenido |
|---|---|
| [1. Convenciones](#1-convenciones) | Autenticación, errores y placeholders |
| [2. Store](#2-store) | `sync`, `sync-wholesale`, `wholesale-summary`, `custom` |
| [3. Admin](#3-admin) | `wholesale-price` (variante), `wholesale-prices` (producto), `custom` |
| [4. Pendientes y no verificado](#4-pendientes-y-no-verificado) | Lo que falta revisar |

Todas las rutas viven en `backend/apps/backend/src/api/`. Este documento solo
cubre las rutas propias del proyecto; las rutas nativas de Medusa (por ejemplo
`/store/carts`, `/store/products`) están en la documentación oficial de Medusa.

---

## 1. Convenciones

**Autenticación** (la aplica Medusa a todo `/store` y `/admin`, ver
`@medusajs/framework/dist/http/router.js`):

- `/store/*`: header `x-publishable-api-key: <PUBLISHABLE_KEY>` obligatorio.
  Sin él, Medusa responde **400** con
  `Publishable API key required in the request header: x-publishable-api-key. ...`
  La sesión de cliente es opcional.
- `/admin/*`: usuario administrador autenticado (cookie de sesión del
  dashboard, token `Bearer` o secret API key). Sin autenticación: **401**.

**Errores de Medusa**: los errores lanzados como `MedusaError` se convierten a
`NOT_FOUND` → 404, `INVALID_DATA`/`NOT_ALLOWED` → 400, `CONFLICT` → 409,
`UNAUTHORIZED` → 401 (ver `error-handler.js` del framework). El cuerpo es
`{ "type": "...", "message": "..." }`.

**Placeholders**: `<BACKEND_URL>` (p. ej. `http://localhost:9000`),
`<PUBLISHABLE_KEY>`, `<CART_ID>`, `<PRODUCT_ID>`, `<VARIANT_ID>`, `<SKU>`, `<ADMIN_TOKEN>`.

**Montos**: en unidades de la moneda (80 = $80.00 MXN), igual que Medusa v2.

---

## 2. Store

### 2.1 `PUT /store/custom/carts/:id/sync`

Archivo: `src/api/store/custom/carts/[id]/sync/route.ts` · Workflow:
`src/workflows/sync-cart-items.ts`

**Para qué sirve**: lleva el carrito al **estado deseado** que envía el
frontend (la lista completa de variantes y cantidades) y aplica la regla de
mayoreo. Reemplaza las llamadas por clic (agregar / actualizar / eliminar).

**Autenticación**: publishable key.

**Parámetros**

| Nombre | Dónde | Tipo | Descripción |
|---|---|---|---|
| `id` | ruta | string | Id del carrito |
| `items` | body | `{ variant_id: string; quantity: number }[]` | Estado completo deseado |

Reglas del body (validadas en el servidor):

- `items` debe ser un arreglo (puede ser vacío: vacía el carrito).
- `variant_id`: texto no vacío y sin repetir.
- `quantity`: entero entre `0` y `MAX_ITEM_QUANTITY` (9999, en
  `src/lib/wholesale-pricing.ts`). `0` elimina la variante.
- Las variantes del carrito que **no** aparecen en `items` se eliminan.

**Ejemplo de petición**

```bash
curl -X PUT "<BACKEND_URL>/store/custom/carts/<CART_ID>/sync" \
  -H "x-publishable-api-key: <PUBLISHABLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{ "items": [ { "variant_id": "<VARIANT_ID>", "quantity": 3 } ] }'
```

**Ejemplo de respuesta (200)** — campos de línea abreviados; `items` trae todos
los campos del line item de Medusa (`items.*`) más `retail_price` y
`wholesale_price`:

```json
{
  "cart": {
    "id": "<CART_ID>",
    "currency_code": "mxn",
    "items": [
      {
        "id": "<LINE_ITEM_ID>",
        "variant_id": "<VARIANT_ID>",
        "quantity": 3,
        "unit_price": 80,
        "is_custom_price": false,
        "product_title": "Sandalia",
        "variant_title": "24",
        "retail_price": 80,
        "wholesale_price": 60
      }
    ]
  },
  "wholesale": {
    "applied": false,
    "total_pairs": 3,
    "threshold": 15,
    "pairs_remaining": 12,
    "wholesale_label": null
  },
  "max_quantity": 9999,
  "changes": { "deleted": 0, "updated": 1, "added": 0 }
}
```

**Errores**

| Código | Mensaje | Causa |
|---|---|---|
| 400 | `items debe ser un arreglo [{ variant_id, quantity }]` | Body sin `items` o no es arreglo |
| 400 | `items[i] debe ser un objeto { variant_id, quantity }` | Elemento inválido |
| 400 | `items[i].variant_id debe ser un texto no vacío` | `variant_id` vacío o no texto |
| 400 | `items[i].variant_id está repetido (<id>)` | Variante duplicada |
| 400 | `items[i].quantity debe ser un entero entre 0 y 9999` | Decimal, negativo, texto o > 9999 |
| 404 | `Carrito <id> no encontrado` | El carrito no existe |
| 4xx/5xx | Mensaje de Medusa | Errores de los workflows nativos, p. ej. variante inexistente o producto no publicado al agregar (**código exacto no verificado**) |

**Efectos secundarios**

1. Toma un lock con la clave `custom-cart-sync:<id>` (espera hasta 30 s).
2. Elimina líneas (`deleteLineItemsWorkflow`), actualiza cantidades
   (`updateLineItemInCartWorkflow`, una por línea) y agrega variantes nuevas
   (`addToCartWorkflow`). Deja **una sola línea por variante**: si hay
   duplicadas, elimina las extra.
3. Aplica el mayoreo a todas las líneas: cambia `unit_price` e
   `is_custom_price` (ver [mayoreo.md](./mayoreo.md#5-por-qué-is_custom_price)).
4. Es **idempotente**: reenviar el mismo estado no cambia nada
   (`changes` en cero).

> **Sin rollback parcial**: cada workflow nativo es una ejecución
> independiente. Si uno falla a mitad, lo ya aplicado **no se revierte**. El
> frontend lo corrige reenviando el estado deseado completo (idempotente).

### 2.2 `POST /store/custom/carts/:id/sync-wholesale`

Archivo: `src/api/store/custom/carts/[id]/sync-wholesale/route.ts` · Workflow:
`src/workflows/apply-cart-wholesale.ts`

**Para qué sirve**: aplica solo la regla de mayoreo al carrito actual, sin
cambiar cantidades. El frontend actual ya no lo llama (usa `sync`), pero sigue
disponible.

**Autenticación**: publishable key. **Body**: ninguno.

```bash
curl -X POST "<BACKEND_URL>/store/custom/carts/<CART_ID>/sync-wholesale" \
  -H "x-publishable-api-key: <PUBLISHABLE_KEY>"
```

**Respuesta (200)**: `cart` es el carrito de `cartModuleService.retrieveCart`
con la relación `items` (sin `retail_price`/`wholesale_price`).

```json
{
  "cart": { "id": "<CART_ID>", "items": [ { "id": "<LINE_ITEM_ID>", "quantity": 15, "unit_price": 60 } ] },
  "wholesale": {
    "applied": true,
    "total_pairs": 15,
    "threshold": 15,
    "pairs_remaining": 0,
    "wholesale_label": "Precio de mayoreo (15+ pares)"
  }
}
```

**Errores**: 404 `Carrito <id> no encontrado`.

**Efectos secundarios**: usa el mismo lock (`custom-cart-sync:<id>`) y el mismo
paso de mayoreo que `sync`; modifica `unit_price` e `is_custom_price` de las
líneas.

### 2.3 `GET /store/custom/carts/:id/wholesale-summary`

Archivo: `src/api/store/custom/carts/[id]/wholesale-summary/route.ts`

**Para qué sirve**: resumen de pares y umbral, sin modificar nada.

**Autenticación**: publishable key.

```bash
curl "<BACKEND_URL>/store/custom/carts/<CART_ID>/wholesale-summary" \
  -H "x-publishable-api-key: <PUBLISHABLE_KEY>"
```

```json
{
  "total_pairs": 3,
  "wholesale_applied": false,
  "threshold": 15,
  "pairs_remaining": 12,
  "wholesale_label": null
}
```

**Errores**: si el carrito no existe, el error lo lanza `retrieveCart` de
Medusa (**código exacto no verificado**, se espera 404).

**Efectos secundarios**: ninguno (solo lectura).

> Nota: esta ruta todavía tiene el umbral `15` escrito a mano; no usa la
> constante compartida `WHOLESALE_MIN_QUANTITY`.

### 2.4 `GET /store/custom`

Archivo: `src/api/store/custom/route.ts`. Ruta de ejemplo de la plantilla de
Medusa: responde `200` sin cuerpo. No tiene uso en el proyecto.

---

## 3. Admin

Las rutas de esta sección usan la lógica de
`src/lib/wholesale-pricing.ts` (`parsePriceTarget`, `planVariantPrices` con
`strictDuplicates: true`, `applyVariantPricePlans`, `serializeVariantPrices`).

**Objeto de precios de una variante** (lo devuelven todas las rutas de esta
sección):

```json
{
  "variant_id": "<VARIANT_ID>",
  "title": "25",
  "sku": "<SKU>",
  "currency_code": "mxn",
  "min_quantity": 15,
  "retail_amount": 80,
  "retail_count": 1,
  "wholesale_amount": 60,
  "wholesale_count": 1
}
```

- `retail_amount`: precio MXN sin reglas y sin `min_quantity`. Es `null` si no
  hay ninguno **o si hay más de uno** (`retail_count` > 1).
- `wholesale_amount`: precio MXN sin reglas con `min_quantity` = 15, o `null`.
  Si hay varios (`wholesale_count` > 1), es el primero.

**Variante bloqueada**: `retail_count` > 1 o `wholesale_count` > 1. Estas rutas
no la modifican ni borran nada; hay que dejar un solo precio de cada tipo a mano.
(El script `seed-mayoreo.ts`, en cambio, sí elimina los mayoreos duplicados).

**Body de los POST**

| Campo | Tipo | Descripción |
|---|---|---|
| `retail_amount` | `number` (opcional) | Precio normal, mayor que 0. Si se omite, se conserva el actual |
| `wholesale_amount` | `number \| null` (opcional) | Mayoreo, mayor que 0 y menor que el normal **resultante**. `null` elimina solo el mayoreo. Si se omite, se conserva el actual, pero se vuelve a validar contra el normal nuevo |

Hay que enviar al menos uno de los dos.

**Efectos secundarios de los POST**: ejecutan `updateProductVariantsWorkflow`,
que reemplaza la lista de precios de cada variante. Se reenvían por `id` (sin
`rules`) todos los precios que se conservan, así que los precios con reglas de
región, los de otras monedas y los MXN con otros mínimos quedan intactos. Los
precios de listas de precios no se tocan. Las variantes que ya tienen los
valores pedidos no se envían.

### 3.1 `GET /admin/variants/:id/wholesale-price`

Archivo: `src/api/admin/variants/[id]/wholesale-price/route.ts`

**Para qué sirve**: leer el precio normal y el de mayoreo de una variante.

**Autenticación**: sesión de administrador.

```bash
curl "<BACKEND_URL>/admin/variants/<VARIANT_ID>/wholesale-price" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Respuesta (200)**: el objeto de precios de la variante.

**Errores**: 404 `Variante <id> no encontrada`.

**Efectos secundarios**: ninguno.

### 3.2 `POST /admin/variants/:id/wholesale-price`

**Para qué sirve**: guardar el precio normal y/o el de mayoreo de **una**
variante. Lo usa el botón **Guardar** de cada fila del widget.

**Autenticación**: sesión de administrador.

**Body**: `{ retail_amount?, wholesale_amount? }` (ver arriba). Por
compatibilidad acepta también `amount` como alias de `wholesale_amount` (se
usa solo si `wholesale_amount` no viene).

```bash
curl -X POST "<BACKEND_URL>/admin/variants/<VARIANT_ID>/wholesale-price" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "retail_amount": 85, "wholesale_amount": 62 }'
```

**Respuesta (200)**: el objeto de precios ya guardado, más `updated` (`false`
si ya tenía esos valores) y `warnings` (texto; p. ej. precios MXN sin reglas
con otros mínimos que se conservan):

```json
{
  "variant_id": "<VARIANT_ID>",
  "title": "25",
  "sku": "<SKU>",
  "currency_code": "mxn",
  "min_quantity": 15,
  "retail_amount": 85,
  "retail_count": 1,
  "wholesale_amount": 62,
  "wholesale_count": 1,
  "updated": true,
  "warnings": []
}
```

**Errores**

| Código | Mensaje |
|---|---|
| 400 | `Envía retail_amount (número > 0) y/o wholesale_amount (número > 0, o null para eliminar el mayoreo)` |
| 400 | `retail_amount debe ser un número mayor que 0` |
| 400 | `wholesale_amount debe ser un número mayor que 0 o null` |
| 400 | `No se puede guardar: el mayoreo (<x>) debe ser menor que el normal (<y>)` (`code: "conflict"`) |
| 400 | `No se puede guardar: no hay precio normal MXN sin reglas con el cual comparar el mayoreo` (`code: "conflict"`) |
| 400 | `No se puede guardar: tiene N precios MXN sin reglas y sin min_quantity (...); resuélvelo a mano` (`code: "blocked"`) |
| 400 | `No se puede guardar: tiene N precios de mayoreo (min 15) (...); resuélvelo a mano` (`code: "blocked"`) |
| 400 | `No se puede guardar: sin price_set` (`code: "blocked"`) |
| 404 | `Variante <id> no encontrada` |

### 3.3 `GET /admin/products/:id/wholesale-prices`

Archivo: `src/api/admin/products/[id]/wholesale-prices/route.ts`

**Para qué sirve**: leer los precios de todas las variantes del producto en una
sola petición. El widget la usa al cargar.

**Autenticación**: sesión de administrador.

```bash
curl "<BACKEND_URL>/admin/products/<PRODUCT_ID>/wholesale-prices" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Respuesta (200)**: `{ "variants": [ <objeto de precios>, ... ] }`.

**Errores**: 404 `Producto <id> no encontrado`.

**Efectos secundarios**: ninguno.

### 3.4 `POST /admin/products/:id/wholesale-prices`

**Para qué sirve**: aplicar el mismo precio normal y/o de mayoreo a **todas**
las variantes del producto en una sola petición. La usan los botones
"Aplicar ... a todas las variantes" del widget.

**Autenticación**: sesión de administrador.

**Body**: `{ retail_amount?, wholesale_amount? }` (ver arriba; aquí no se
acepta `amount`).

```bash
curl -X POST "<BACKEND_URL>/admin/products/<PRODUCT_ID>/wholesale-prices" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "retail_amount": 90 }'
```

**Todo o nada ante conflictos**: se planea cada variante antes de aplicar. Si
**alguna** queda en conflicto (mayoreo mayor o igual que el normal resultante,
o mayoreo sin precio normal con el cual compararlo), responde 400 y **no aplica
nada**:

```json
{
  "message": "No se aplicó ningún cambio: 1 variante(s) en conflicto. 26: el mayoreo (60) debe ser menor que el normal (55)",
  "conflicts": [
    { "variant_id": "<VARIANT_ID>", "title": "26", "reason": "el mayoreo (60) debe ser menor que el normal (55)" }
  ]
}
```

Las variantes **bloqueadas** no cuentan como conflicto: se omiten sin tocarlas y
el resto sí se actualiza.

**Respuesta (200)**

```json
{
  "updated": 5,
  "unchanged": 1,
  "skipped": [
    { "variant_id": "<VARIANT_ID>", "title": "27", "reason": "tiene 2 precios MXN sin reglas y sin min_quantity (...); resuélvelo a mano" }
  ],
  "warnings": [
    { "variant_id": "<VARIANT_ID>", "title": "25", "messages": ["se conservan 1 precio(s) MXN sin reglas con otros mínimos/máximos: ..."] }
  ],
  "variants": [ "<objeto de precios de cada variante, ya actualizado>" ]
}
```

**Errores**

| Código | Mensaje |
|---|---|
| 400 | Los mismos de validación del body que en 3.2 |
| 400 | `No se aplicó ningún cambio: N variante(s) en conflicto. ...`, con `conflicts` |
| 404 | `Producto <id> no encontrado` |

**Efectos secundarios**: una sola ejecución de `updateProductVariantsWorkflow`
con todas las variantes que cambian. Que esa ejecución revierta todo si falla a
mitad depende de la compensación del workflow nativo: **no verificado**.

### 3.5 `GET /admin/custom`

Archivo: `src/api/admin/custom/route.ts`. Ruta de ejemplo de la plantilla:
responde `200` sin cuerpo.

---

## 4. Pendientes y no verificado

- Ninguno de estos endpoints se probó con peticiones reales al escribir este
  documento; los ejemplos de respuesta se derivaron del código.
- Códigos HTTP de los errores que vienen de workflows nativos de Medusa
  (variante inexistente, producto no publicado, lock que no se obtiene en 30 s):
  no verificados.
- El lock usa el módulo de locking configurado. En desarrollo Medusa usa el
  proveedor **in-memory** (aparece en el log al arrancar), que solo serializa
  peticiones dentro de un mismo proceso.
