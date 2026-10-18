import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils";
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows";
import {
  CART_WHOLESALE_FIELDS,
  cartSyncLockKey,
  planCartWholesale,
  type LinePricing,
  type LineUpdate,
  type WholesaleSummary,
} from "../lib/cart-wholesale";

export type ApplyCartWholesaleResult = {
  wholesale: WholesaleSummary;
  lines: LinePricing[];
};

/**
 * Aplica la regla de mayoreo a todas las líneas del carrito.
 * Debe ir al FINAL de cualquier cambio del carrito: los workflows de Medusa
 * recalculan el unit_price de las líneas que no tienen is_custom_price.
 */
export const applyCartWholesaleStep = createStep(
  "apply-cart-wholesale",
  async ({ cart_id }: { cart_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const cartModuleService = container.resolve(Modules.CART);

    const { data } = await query.graph({
      entity: "cart",
      fields: CART_WHOLESALE_FIELDS,
      filters: { id: cart_id },
    });
    const cart: any = data?.[0];
    if (!cart) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Carrito ${cart_id} no encontrado`);
    }

    const { wholesale, updates, lines } = planCartWholesale(cart);

    // Valores previos para revertir si un paso posterior falla.
    const previous: LineUpdate[] = updates.map((u) => {
      const item = cart.items.find((i: any) => i.id === u.id);
      return {
        id: u.id,
        unit_price: Number(item.unit_price),
        is_custom_price: !!item.is_custom_price,
      };
    });

    if (updates.length) {
      await cartModuleService.updateLineItems(updates);
    }

    return new StepResponse<ApplyCartWholesaleResult, LineUpdate[]>(
      { wholesale, lines },
      previous
    );
  },
  async (previous, { container }) => {
    if (!previous?.length) return;
    const cartModuleService = container.resolve(Modules.CART);
    await cartModuleService.updateLineItems(previous);
  }
);

/**
 * Workflow usado por POST /store/custom/carts/:id/sync-wholesale.
 * Usa el mismo lock que sync-cart-items para no pisarse con una sincronización.
 */
export const applyCartWholesaleWorkflow = createWorkflow(
  "apply-cart-wholesale",
  (input: { cart_id: string }) => {
    const lockKey = transform({ input }, ({ input }) => cartSyncLockKey(input.cart_id));

    acquireLockStep({ key: lockKey, timeout: 30, ttl: 60 });
    const result = applyCartWholesaleStep({ cart_id: input.cart_id });
    releaseLockStep({ key: lockKey });

    return new WorkflowResponse(result);
  }
);
