import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  fetchAllVariantsWithPrices,
  planWholesaleThresholdSync,
} from "../../../lib/wholesale-pricing";
import {
  getWholesaleThreshold,
  isValidWholesaleThreshold,
} from "../../../lib/wholesale-settings";
import {
  MAX_WHOLESALE_THRESHOLD,
  MIN_WHOLESALE_THRESHOLD,
} from "../../../modules/wholesale-settings/constants";
import { updateWholesaleThresholdWorkflow } from "../../../workflows/update-wholesale-threshold";

type SettingsBody = { threshold?: unknown };

/**
 * GET /admin/wholesale-settings
 * Umbral global de mayoreo (pares mínimos sumando todo el carrito).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  res.json({ threshold: await getWholesaleThreshold(req.scope) });
}

/**
 * POST /admin/wholesale-settings  { threshold }   (?dry_run=true para solo calcular)
 * Guarda el umbral y lleva el min_quantity de TODOS los precios de mayoreo
 * (MXN sin reglas con min_quantity > 1) al nuevo valor, en una sola ejecución
 * de updateProductVariantsWorkflow. No toca precios normales, con reglas, de
 * otras monedas ni de listas de precios. Las variantes que no se pueden
 * actualizar (p. ej. mayoreos duplicados) no se tocan y vuelven en `blocked`.
 */
export async function POST(
  req: MedusaRequest<SettingsBody>,
  res: MedusaResponse
): Promise<void> {
  const threshold = req.body?.threshold;
  if (!isValidWholesaleThreshold(threshold)) {
    res.status(400).json({
      message:
        `threshold debe ser un número entero entre ${MIN_WHOLESALE_THRESHOLD} ` +
        `y ${MAX_WHOLESALE_THRESHOLD}`,
    });
    return;
  }
  const dryRun = ["1", "true"].includes(String(req.query.dry_run ?? "").toLowerCase());

  // Lectura por lotes de 200; los cambios se aplican juntos en el workflow.
  const variants = await fetchAllVariantsWithPrices(req.scope, 200);
  const { product_variants, updated_prices, blocked } = planWholesaleThresholdSync(
    variants,
    threshold
  );

  if (dryRun) {
    res.json({
      dry_run: true,
      current_threshold: await getWholesaleThreshold(req.scope),
      threshold,
      updated_prices,
      blocked,
    });
    return;
  }

  const { result } = await updateWholesaleThresholdWorkflow(req.scope).run({
    input: { threshold, product_variants },
  });

  res.json({ threshold: result.threshold, updated_prices: result.updated_prices, blocked });
}
