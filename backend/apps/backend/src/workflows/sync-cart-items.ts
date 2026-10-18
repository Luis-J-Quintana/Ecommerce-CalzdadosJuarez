import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import {
  acquireLockStep,
  addToCartWorkflow,
  deleteLineItemsWorkflow,
  releaseLockStep,
  updateLineItemInCartWorkflow,
} from "@medusajs/medusa/core-flows";
import { cartSyncLockKey } from "../lib/cart-wholesale";
import { applyCartWholesaleStep } from "./apply-cart-wholesale";

export type DesiredCartItem = { variant_id: string; quantity: number };

export type SyncCartItemsInput = {
  cart_id: string;
  /** Estado completo deseado: las variantes que no aparezcan se eliminan. */
  items: DesiredCartItem[];
};

type SyncPlan = {
  toDelete: string[];
  toUpdate: { item_id: string; quantity: number }[];
  toAdd: DesiredCartItem[];
};

/** Diferencia entre el carrito actual y el estado deseado. */
export function diffCartItems(
  current: { id: string; variant_id: string | null; quantity: number }[],
  desired: DesiredCartItem[]
): SyncPlan {
  const wanted = new Map(desired.map((d) => [d.variant_id, d.quantity]));
  const plan: SyncPlan = { toDelete: [], toUpdate: [], toAdd: [] };
  const seen = new Set<string>();

  for (const line of current) {
    const variantId = line.variant_id ?? "";
    const quantity = wanted.get(variantId) ?? 0;

    // Una sola línea por variante: las demás (o las que ya no se quieren) se eliminan.
    if (!variantId || quantity === 0 || seen.has(variantId)) {
      plan.toDelete.push(line.id);
      continue;
    }
    seen.add(variantId);
    if (Number(line.quantity) !== quantity) {
      plan.toUpdate.push({ item_id: line.id, quantity });
    }
  }

  for (const d of desired) {
    if (d.quantity > 0 && !seen.has(d.variant_id)) {
      plan.toAdd.push(d);
    }
  }
  return plan;
}

/**
 * Lleva el carrito al estado deseado usando los workflows nativos de Medusa.
 * Cada workflow nativo es una ejecución independiente (con su propio lock por
 * cart_id), así que si uno falla a mitad, lo ya aplicado NO se revierte. Como la
 * operación es idempotente, reenviar el mismo estado deseado termina de corregirlo.
 */
const syncCartItemsStep = createStep(
  "sync-cart-items-diff",
  async (input: SyncCartItemsInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data } = await query.graph({
      entity: "cart",
      fields: ["id", "items.id", "items.variant_id", "items.quantity"],
      filters: { id: input.cart_id },
    });
    const cart: any = data?.[0];
    if (!cart) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Carrito ${input.cart_id} no encontrado`);
    }

    const plan = diffCartItems(cart.items ?? [], input.items);

    if (plan.toDelete.length) {
      await deleteLineItemsWorkflow(container).run({
        input: { cart_id: input.cart_id, ids: plan.toDelete },
      });
    }
    for (const u of plan.toUpdate) {
      await updateLineItemInCartWorkflow(container).run({
        input: { cart_id: input.cart_id, item_id: u.item_id, update: { quantity: u.quantity } },
      });
    }
    if (plan.toAdd.length) {
      await addToCartWorkflow(container).run({
        input: { cart_id: input.cart_id, items: plan.toAdd },
      });
    }

    return new StepResponse({
      deleted: plan.toDelete.length,
      updated: plan.toUpdate.length,
      added: plan.toAdd.length,
    });
  }
);

/**
 * PUT /store/custom/carts/:id/sync
 * 1. Lock por carrito (clave propia: los workflows nativos ya usan cart_id como clave).
 * 2. Aplica la diferencia con el estado deseado.
 * 3. Aplica el mayoreo al final (applyCartWholesaleStep, que lee el umbral global
 *    con getWholesaleThreshold), para que ningún recálculo posterior lo pise.
 */
export const syncCartItemsWorkflow = createWorkflow(
  "sync-cart-items",
  (input: SyncCartItemsInput) => {
    const lockKey = transform({ input }, ({ input }) => cartSyncLockKey(input.cart_id));

    acquireLockStep({ key: lockKey, timeout: 30, ttl: 120 });
    const changes = syncCartItemsStep(input);
    const pricing = applyCartWholesaleStep({ cart_id: input.cart_id });
    releaseLockStep({ key: lockKey });

    const result = transform({ changes, pricing }, ({ changes, pricing }) => ({
      changes,
      ...pricing,
    }));
    return new WorkflowResponse(result);
  }
);
