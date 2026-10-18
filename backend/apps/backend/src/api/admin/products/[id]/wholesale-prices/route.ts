import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  VARIANT_PRICE_FIELDS,
  applyVariantPricePlans,
  parsePriceTarget,
  planVariantPrices,
  serializeVariantPrices,
  type AmountsBody,
  type VariantWithPrices,
} from "../../../../../lib/wholesale-pricing";

/** Variantes del producto con sus precios, o null si el producto no existe. */
async function getProductVariants(req: MedusaRequest) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", ...VARIANT_PRICE_FIELDS.map((f) => `variants.${f}`)],
    filters: { id: req.params.id },
  });
  const product = data[0] as { variants?: VariantWithPrices[] | null } | undefined;
  return product ? (product.variants ?? []) : null;
}

const notFound = (req: MedusaRequest, res: MedusaResponse) =>
  res.status(404).json({ message: `Producto ${req.params.id} no encontrado` });

const label = (v: VariantWithPrices) => v.title ?? v.sku ?? v.id;

/**
 * GET /admin/products/:id/wholesale-prices
 * Precio normal y de mayoreo de todas las variantes del producto.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const variants = await getProductVariants(req);
  if (!variants) {
    notFound(req, res);
    return;
  }
  res.json({ variants: variants.map(serializeVariantPrices) });
}

/**
 * POST /admin/products/:id/wholesale-prices
 *   { retail_amount?: number, wholesale_amount?: number | null }
 * Aplica el mismo precio normal y/o de mayoreo a TODAS las variantes en una sola
 * ejecución de updateProductVariantsWorkflow.
 *
 * - Si alguna variante queda en conflicto (mayoreo >= normal resultante, o sin
 *   normal con el cual comparar), responde 400 con la lista y no aplica nada.
 * - Las variantes bloqueadas (precios normales o de mayoreo duplicados) no se
 *   tocan; se devuelven en `skipped` y el resto sí se actualiza.
 */
export async function POST(
  req: MedusaRequest<AmountsBody>,
  res: MedusaResponse
): Promise<void> {
  const parsed = parsePriceTarget(req.body);
  if ("error" in parsed) {
    res.status(400).json({ message: parsed.error });
    return;
  }

  const variants = await getProductVariants(req);
  if (!variants) {
    notFound(req, res);
    return;
  }

  const byId = new Map(variants.map((v) => [v.id, v]));
  const plans = variants.map((v) =>
    planVariantPrices(v, parsed.target, { strictDuplicates: true })
  );

  const describeSkip = (code: "conflict" | "blocked") =>
    plans.flatMap((p) =>
      p.status === "skip" && p.code === code
        ? [{ variant_id: p.variantId, title: label(byId.get(p.variantId)!), reason: p.reason }]
        : []
    );

  const conflicts = describeSkip("conflict");
  if (conflicts.length) {
    res.status(400).json({
      message:
        `No se aplicó ningún cambio: ${conflicts.length} variante(s) en conflicto. ` +
        conflicts.map((c) => `${c.title}: ${c.reason}`).join("; "),
      conflicts,
    });
    return;
  }

  await applyVariantPricePlans(req.scope, plans);

  const updated = plans.filter((p) => p.status === "update").length;
  const after = updated ? ((await getProductVariants(req)) ?? variants) : variants;

  res.json({
    updated,
    unchanged: plans.filter((p) => p.status === "unchanged").length,
    skipped: describeSkip("blocked"),
    warnings: plans.flatMap((p) =>
      p.warnings.length
        ? [{ variant_id: p.variantId, title: label(byId.get(p.variantId)!), messages: p.warnings }]
        : []
    ),
    variants: after.map(serializeVariantPrices),
  });
}
