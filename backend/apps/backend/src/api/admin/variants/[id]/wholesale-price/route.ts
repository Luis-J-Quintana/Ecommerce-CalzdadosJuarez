import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  applyVariantPricePlans,
  fetchVariantsWithPrices,
  parsePriceTarget,
  planVariantPrices,
  serializeVariantPrices,
  type AmountsBody,
} from "../../../../../lib/wholesale-pricing";

async function getVariant(req: MedusaRequest) {
  const [variant] = await fetchVariantsWithPrices(req.scope, { id: req.params.id });
  return variant;
}

/**
 * GET /admin/variants/:id/wholesale-price
 * Devuelve el precio normal (MXN sin reglas ni mínimo) y el de mayoreo
 * (MXN sin reglas con min_quantity = WHOLESALE_MIN_QUANTITY) de la variante.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const variant = await getVariant(req);
  if (!variant) {
    res.status(404).json({ message: `Variante ${req.params.id} no encontrada` });
    return;
  }
  res.json(serializeVariantPrices(variant));
}

/**
 * POST /admin/variants/:id/wholesale-price
 *   { retail_amount?: number, wholesale_amount?: number | null }
 * Actualiza el precio normal y/o el de mayoreo; wholesale_amount null elimina
 * solo el mayoreo. Acepta `amount` como alias anterior de wholesale_amount.
 * Los precios con reglas, de otras monedas y de listas de precios se conservan.
 */
export async function POST(
  req: MedusaRequest<AmountsBody>,
  res: MedusaResponse
): Promise<void> {
  const parsed = parsePriceTarget(req.body, { allowLegacyAmount: true });
  if ("error" in parsed) {
    res.status(400).json({ message: parsed.error });
    return;
  }

  const variant = await getVariant(req);
  if (!variant) {
    res.status(404).json({ message: `Variante ${req.params.id} no encontrada` });
    return;
  }

  const plan = planVariantPrices(variant, parsed.target, { strictDuplicates: true });
  if (plan.status === "skip") {
    res.status(400).json({
      message: `No se puede guardar: ${plan.reason}`,
      code: plan.code,
    });
    return;
  }

  await applyVariantPricePlans(req.scope, [plan]);

  const updated = plan.status === "update" ? await getVariant(req) : variant;
  res.json({
    ...serializeVariantPrices(updated),
    updated: plan.status === "update",
    warnings: plan.warnings,
  });
}
