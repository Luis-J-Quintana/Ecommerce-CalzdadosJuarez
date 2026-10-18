import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  WHOLESALE_CURRENCY,
  WHOLESALE_MIN_QUANTITY,
  applyVariantPricePlans,
  fetchVariantsWithPrices,
  planVariantPrices,
  readWholesale,
  type VariantWithPrices,
} from "../../../../../lib/wholesale-pricing";

type WholesalePriceBody = { amount?: number | null };

/** Respuesta común de GET y POST: precio normal y de mayoreo actuales. */
function serialize(variant: VariantWithPrices) {
  const { retail, retailCount, wholesale } = readWholesale(variant);
  return {
    variant_id: variant.id,
    currency_code: WHOLESALE_CURRENCY,
    min_quantity: WHOLESALE_MIN_QUANTITY,
    retail_amount: retail,
    retail_count: retailCount,
    wholesale_amount: wholesale,
  };
}

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
  res.json(serialize(variant));
}

/**
 * POST /admin/variants/:id/wholesale-price  { amount: number | null }
 * Crea o actualiza solo el precio de mayoreo; con amount null lo elimina.
 * El precio normal y los precios con reglas se conservan.
 */
export async function POST(
  req: MedusaRequest<WholesalePriceBody>,
  res: MedusaResponse
): Promise<void> {
  const raw = req.body?.amount;
  if (raw === undefined) {
    res.status(400).json({ message: "Falta amount (número > 0 o null para eliminar)" });
    return;
  }
  if (raw !== null && (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0)) {
    res.status(400).json({ message: "amount debe ser un número mayor que 0 o null" });
    return;
  }

  const variant = await getVariant(req);
  if (!variant) {
    res.status(404).json({ message: `Variante ${req.params.id} no encontrada` });
    return;
  }

  // Sin retailAmount: el precio normal no se toca, solo se compara contra él.
  const plan = planVariantPrices(variant, { wholesaleAmount: raw });
  if (plan.status === "skip") {
    res.status(400).json({ message: `No se puede guardar: ${plan.reason}` });
    return;
  }

  await applyVariantPricePlans(req.scope, [plan]);

  const updated = plan.status === "update" ? await getVariant(req) : variant;
  res.json({ ...serialize(updated), warnings: plan.warnings });
}
