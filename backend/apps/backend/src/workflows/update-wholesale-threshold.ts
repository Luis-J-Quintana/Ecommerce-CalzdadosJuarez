import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows";
import { resolveWholesaleSettings } from "../lib/wholesale-settings";
import type { toProductVariantUpdates } from "../lib/wholesale-pricing";
import { DEFAULT_WHOLESALE_THRESHOLD } from "../modules/wholesale-settings/constants";

export type UpdateWholesaleThresholdInput = {
  threshold: number;
  /** Variantes con el min_quantity de su mayoreo ya ajustado (planWholesaleThresholdSync). */
  product_variants: ReturnType<typeof toProductVariantUpdates>;
};

/** Guarda el umbral; si un paso posterior falla, restaura el valor anterior. */
const saveWholesaleThresholdStep = createStep(
  "save-wholesale-threshold",
  async ({ threshold }: { threshold: number }, { container }) => {
    const previous = await resolveWholesaleSettings(container).setThreshold(threshold);
    return new StepResponse(threshold, { previous });
  },
  async (data, { container }) => {
    if (!data) return;
    // Sin fila previa se leía el valor por defecto: se restaura ese.
    await resolveWholesaleSettings(container).setThreshold(
      data.previous ?? DEFAULT_WHOLESALE_THRESHOLD
    );
  }
);

/**
 * POST /admin/wholesale-settings
 * 1. Guarda el umbral global.
 * 2. Actualiza el min_quantity de todos los precios de mayoreo en UNA sola
 *    ejecución de updateProductVariantsWorkflow. Si falla, se compensa el paso 1.
 */
export const updateWholesaleThresholdWorkflow = createWorkflow(
  "update-wholesale-threshold",
  (input: UpdateWholesaleThresholdInput) => {
    const threshold = saveWholesaleThresholdStep({ threshold: input.threshold });

    when({ input }, ({ input }) => input.product_variants.length > 0).then(() => {
      updateProductVariantsWorkflow.runAsStep({
        input: { product_variants: input.product_variants },
      });
    });

    const result = transform({ threshold, input }, ({ threshold, input }) => ({
      threshold,
      updated_prices: input.product_variants.length,
    }));
    return new WorkflowResponse(result);
  }
);
