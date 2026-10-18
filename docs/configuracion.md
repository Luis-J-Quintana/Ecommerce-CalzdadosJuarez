# Configuración y pruebas

Última actualización: 18 de octubre de 2026

| Sección | Contenido |
|---|---|
| [1. Variables del frontend](#1-variables-del-frontend) | `frontend/.env` |
| [2. Variables del backend](#2-variables-del-backend) | `backend/apps/backend/.env` |
| [3. Variables de Docker](#3-variables-de-docker) | `.env` de la raíz |
| [4. Script de mayoreo](#4-script-de-mayoreo) | Cómo correrlo |
| [5. Migración del módulo de mayoreo](#5-migración-del-módulo-de-mayoreo) | `db:generate` y `db:migrate` |
| [6. Probar el flujo completo](#6-probar-el-flujo-completo) | Paso a paso |

> Este documento solo lista nombres y placeholders. **Nunca** copies llaves,
> contraseñas ni la `DATABASE_URL` reales en la documentación ni en el
> repositorio. Los archivos `.env` están en `.gitignore`.

---

## 1. Variables del frontend

Archivo: `frontend/.env` (lo lee Next.js al arrancar; tras cambiarlo hay que
reiniciar `next dev`).

| Variable | Uso en el código | Cómo obtener el valor |
|---|---|---|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `lib/medusa-client.ts` (por defecto `http://localhost:9000`) | URL donde corre el backend de Medusa |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | `lib/medusa-client.ts`; se envía en cada petición a `/store` | Admin de Medusa → Configuración → Publishable API Keys. Debe estar ligada al canal de venta donde están los productos |
| `NEXT_PUBLIC_MEDUSA_REGION_ID` | `lib/cartProducts.ts`, al crear el carrito | Admin → Configuración → Regiones (la región en MXN), o `GET /store/regions` con la publishable key |

Ejemplo con placeholders:

```dotenv
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<PUBLISHABLE_KEY>
NEXT_PUBLIC_MEDUSA_REGION_ID=<REGION_ID>
```

Las variables `NEXT_PUBLIC_*` quedan expuestas en el navegador; no pongas ahí
nada secreto.

## 2. Variables del backend

Archivo: `backend/apps/backend/.env` (plantilla: `.env.template`). Las lee
`medusa-config.ts` con `loadEnv`.

| Variable | Para qué sirve |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL (el proyecto usa Supabase) |
| `REDIS_URL` | Conexión a Redis |
| `STORE_CORS` | Orígenes permitidos para `/store` (debe incluir la URL del frontend) |
| `ADMIN_CORS` | Orígenes permitidos para `/admin` |
| `AUTH_CORS` | Orígenes permitidos para `/auth` |
| `JWT_SECRET` | Firma de tokens JWT |
| `COOKIE_SECRET` | Firma de cookies de sesión |
| `S3_FILE_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_BUCKET`, `S3_ENDPOINT` | Almacenamiento de archivos (`@medusajs/medusa/file-s3`, compatible con Supabase Storage) |

También aparecen en el `.env` local, pero `medusa-config.ts` no las lee
directamente: `MEDUSA_ADMIN_ONBOARDING_TYPE`, `AUTH_MFA_ENCRYPTION_KEY` y
`DB_NAME` (esta solo en la plantilla). Su uso por Medusa **no está verificado**.

## 3. Variables de Docker

Archivo: `.env` en la raíz, usado por `docker-compose.yml` (PostgreSQL 16 y
Redis 7.2 locales):

| Variable | Uso en `docker-compose.yml` |
|---|---|
| `POSTGRES_CONTAINER`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Servicio `postgres` |
| `REDIS_CONTAINER`, `REDIS_PORT` | Servicio `redis` |

El mismo archivo define `POSTGRES_HOST`, `REDIS_HOST`, `MEDUSA_PORT`,
`NEXT_PUBLIC_API_URL` y `NODE_ENV`, que `docker-compose.yml` no usa; dónde se
usan **no está verificado**.

## 4. Script de mayoreo

Desde `backend/apps/backend`, con un JSON como
`[{ "handle": "<HANDLE>", "precioNormal": 80, "precioMayoreo": 60 }]`:

```bash
npx medusa exec ./src/scripts/seed-mayoreo.ts ./data/mayoreo.json dry-run
npx medusa exec ./src/scripts/seed-mayoreo.ts ./data/mayoreo.json
```

Detalles en [mayoreo.md](./mayoreo.md#7-script-seed-mayoreots).

## 5. Migración del módulo de mayoreo

El umbral global vive en el módulo propio `wholesaleSettings`
(`src/modules/wholesale-settings`), registrado en `medusa-config.ts` con
`resolve: "./src/modules/wholesale-settings"`. Su tabla (`wholesale_setting`)
necesita una migración, que **no está en el repositorio**: hay que generarla y
correrla una vez, desde `backend/apps/backend` y con `DATABASE_URL` apuntando a
la base correcta:

```bash
# 1. Genera el archivo en src/modules/wholesale-settings/migrations/
npx medusa db:generate wholesaleSettings

# 2. Aplica las migraciones pendientes (incluida la nueva)
npx medusa db:migrate
```

- Revisa el archivo generado antes del paso 2 y súbelo al repositorio.
- Mientras la tabla no exista, `getWholesaleThreshold` usa **15** y escribe un
  aviso en el log; `POST /admin/wholesale-settings` sí falla.
- No hace falta insertar ninguna fila: la primera vez que se guarda el umbral
  desde el admin se crea.
- La sintaxis `db:generate [modules...]` se verificó en `@medusajs/cli` 2.17.2;
  los comandos **no se ejecutaron** al escribir esto.

## 6. Probar el flujo completo

1. **Arrancar**: backend con `medusa develop` (en `backend/apps/backend`, o
   `pnpm backend:dev` en `backend/`) y frontend con `next dev` en `frontend/`.
2. **Umbral**: en el admin, en **Productos** (listado), el bloque **Mayoreo**
   muestra el mínimo actual. Cámbialo (p. ej. a 12), confirma y revisa el toast
   con los precios actualizados. Con
   `GET /store/custom/carts/<CART_ID>/wholesale-summary`, `threshold` debe
   devolver el valor nuevo.
3. **Precios**: en el admin (`<BACKEND_URL>/app`), abre un producto y en el
   widget **Precios de mayoreo** guarda un mayoreo menor que el normal para cada
   variante, o usa el script de la §4 (primero en `dry-run`).
4. **Endpoint**, con curl (ver [api-endpoints.md](./api-endpoints.md)):
   - `PUT .../sync` con `quantity: 3` → `wholesale.applied: false` y
     `unit_price` igual a `retail_price`.
   - Mismo body otra vez → `changes` en cero (idempotente).
   - `quantity` igual al umbral (15 por defecto) → `applied: true`, `unit_price` igual a `wholesale_price` e
     `is_custom_price: true`.
   - Volver a `3` → precio normal e `is_custom_price: false`.
   - `quantity: 1.5`, `-1` o `10000` → 400 con mensaje.
5. **Frontend**:
   - Pulsa `+` varias veces rápido: la cantidad y el precio cambian al instante y
     en la pestaña Red del navegador aparece **un solo** `PUT .../sync` unos
     300 ms después del último clic.
   - Escribe `15` en el campo de cantidad y pulsa Enter: el precio visual pasa a
     mayoreo antes de que responda el servidor.
   - Escribe `abc`, `1.5` o pega `-3`: solo quedan dígitos. Vacía el campo y
     sal: vuelve la cantidad anterior. Pulsa Escape a mitad: se cancela.
   - Escribe `99999`: se ajusta a `9999`.
   - Repite en el checkout (`/checkout`).
6. **Rollback**: con el carrito abierto, detén el backend y cambia una cantidad:
   en la consola aparece el error de sincronización. Vuelve a arrancar el backend
   y haz otro cambio: el estado se corrige con el siguiente envío.
