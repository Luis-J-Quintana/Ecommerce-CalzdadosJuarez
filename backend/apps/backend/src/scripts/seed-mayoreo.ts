import { readFileSync } from "fs";
import path from "path";
import type { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  WHOLESALE_MIN_QUANTITY,
  applyVariantPricePlans,
  describePrice,
  fetchVariantsWithPrices,
  planVariantPrices,
  type VariantPricePlan,
} from "../lib/wholesale-pricing";

/**
 * Deja en cada variante de los productos indicados, entre sus precios MXN sin
 * reglas, exactamente uno normal (sin min_quantity) y uno de mayoreo
 * (min_quantity = WHOLESALE_MIN_QUANTITY), que es lo que lee
 * POST /store/custom/carts/:id/sync-wholesale.
 *
 * - Nunca modifica ni elimina precios con reglas (region_id u otras) ni de listas de precios.
 * - Si una variante tiene varios precios MXN sin reglas y sin mínimo, no toca
 *   nada: avisa y la omite.
 * - Es idempotente: las variantes que ya están en el estado deseado se omiten.
 *
 * Uso (desde backend/apps/backend):
 *   npx medusa exec ./src/scripts/seed-mayoreo.ts ./data/mayoreo.json dry-run
 *   npx medusa exec ./src/scripts/seed-mayoreo.ts ./data/mayoreo.json
 *
 * Nota: la CLI de Medusa rechaza opciones desconocidas como `--dry-run`, así que
 * el modo de prueba se activa con el argumento posicional `dry-run` (o DRY_RUN=1).
 *
 * Formato del JSON: [{ "handle": "2502r-rojo", "precioNormal": 549, "precioMayoreo": 399 }]
 */

export type MayoreoInput = {
  handle: string;
  precioNormal: number;
  precioMayoreo: number;
};

function validate(items: MayoreoInput[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  items.forEach((it, i) => {
    const where = `#${i} (${it?.handle ?? "sin handle"})`;
    if (!it?.handle) errors.push(`${where}: falta handle`);
    if (seen.has(it?.handle)) errors.push(`${where}: handle duplicado`);
    seen.add(it?.handle);
    if (!(Number(it?.precioNormal) > 0)) errors.push(`${where}: precioNormal inválido`);
    if (!(Number(it?.precioMayoreo) > 0)) errors.push(`${where}: precioMayoreo inválido`);
    if (Number(it?.precioMayoreo) >= Number(it?.precioNormal)) {
      errors.push(`${where}: precioMayoreo debe ser menor que precioNormal`);
    }
  });
  return errors;
}

export async function seedMayoreo(
  container: MedusaContainer,
  items: MayoreoInput[],
  { dryRun }: { dryRun: boolean }
) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const tag = dryRun ? "[dry-run] " : "";

  const errors = validate(items);
  if (errors.length) {
    throw new Error(`Entrada inválida:\n  ${errors.join("\n  ")}`);
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id"],
    filters: { handle: items.map((it) => it.handle) },
  });
  const byHandle = new Map(products.map((p: any) => [p.handle, p]));

  const summary = { actualizadas: 0, sinCambios: 0, omitidas: 0, noEncontrados: 0 };

  for (const it of items) {
    const product: any = byHandle.get(it.handle);
    if (!product) {
      logger.warn(`${tag}Producto "${it.handle}" no encontrado, se omite.`);
      summary.noEncontrados++;
      continue;
    }

    const variantIds = (product.variants ?? []).map((v: any) => v.id);
    const variants = variantIds.length
      ? await fetchVariantsWithPrices(container, { id: variantIds })
      : [];
    const plans: VariantPricePlan[] = [];

    for (const variant of variants) {
      const label = `${it.handle} / ${variant.title ?? variant.sku ?? variant.id}`;

      if (dryRun) {
        const prices = variant.price_set?.prices ?? [];
        logger.info(`${tag}${label}: precios actuales (${prices.length})`);
        prices.forEach((p) => logger.info(`${tag}    ${describePrice(p)}`));
      }

      const plan = planVariantPrices(variant, {
        retailAmount: Number(it.precioNormal),
        wholesaleAmount: Number(it.precioMayoreo),
      });
      plan.warnings.forEach((w) => logger.warn(`${tag}${label}: ${w}`));

      if (plan.status === "skip") {
        logger.warn(`${tag}${label}: se omite, ${plan.reason}.`);
        summary.omitidas++;
      } else if (plan.status === "unchanged") {
        logger.info(
          `${tag}${label}: ya tiene ${it.precioNormal} / ${it.precioMayoreo} ` +
            `(min ${WHOLESALE_MIN_QUANTITY}) MXN, sin cambios.`
        );
        summary.sinCambios++;
      } else {
        logger.info(`${tag}${label}: ${plan.changes.join("; ")}`);
        plans.push(plan);
      }
    }

    if (!dryRun) {
      await applyVariantPricePlans(container, plans);
    }
    summary.actualizadas += plans.length;
  }

  logger.info(
    `${tag}Resumen: ${summary.actualizadas} variante(s) ${dryRun ? "por actualizar" : "actualizadas"}, ` +
      `${summary.sinCambios} sin cambios, ${summary.omitidas} omitidas, ` +
      `${summary.noEncontrados} producto(s) no encontrados.`
  );
  return summary;
}

export default async function seedMayoreoScript({
  container,
  args = [],
}: {
  container: MedusaContainer;
  args?: string[];
}) {
  const dryRun =
    args.includes("dry-run") ||
    args.includes("--dry-run") ||
    ["1", "true"].includes(String(process.env.DRY_RUN).toLowerCase());
  const file = args.find((a) => !a.includes("dry-run"));

  if (!file) {
    throw new Error(
      "Indica el archivo JSON: npx medusa exec ./src/scripts/seed-mayoreo.ts <archivo.json> [dry-run]"
    );
  }

  const items = JSON.parse(
    readFileSync(path.resolve(process.cwd(), file), "utf-8")
  ) as MayoreoInput[];
  if (!Array.isArray(items)) {
    throw new Error("El JSON debe ser un arreglo [{ handle, precioNormal, precioMayoreo }].");
  }

  await seedMayoreo(container, items, { dryRun });
}
