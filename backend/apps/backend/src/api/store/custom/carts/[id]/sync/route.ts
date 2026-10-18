import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { MAX_ITEM_QUANTITY } from "../../../../../../lib/wholesale-pricing";
import {
  syncCartItemsWorkflow,
  type DesiredCartItem,
} from "../../../../../../workflows/sync-cart-items";

type SyncBody = { items?: unknown };

/** Devuelve el mensaje de error, o null si el body es válido. */
function validateItems(items: unknown): string | null {
  if (!Array.isArray(items)) {
    return "items debe ser un arreglo [{ variant_id, quantity }]";
  }
  const seen = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    const it = items[i] as any;
    if (!it || typeof it !== "object") {
      return `items[${i}] debe ser un objeto { variant_id, quantity }`;
    }
    if (typeof it.variant_id !== "string" || !it.variant_id.trim()) {
      return `items[${i}].variant_id debe ser un texto no vacío`;
    }
    if (seen.has(it.variant_id)) {
      return `items[${i}].variant_id está repetido (${it.variant_id})`;
    }
    seen.add(it.variant_id);
    if (
      typeof it.quantity !== "number" ||
      !Number.isInteger(it.quantity) ||
      it.quantity < 0 ||
      it.quantity > MAX_ITEM_QUANTITY
    ) {
      return `items[${i}].quantity debe ser un entero entre 0 y ${MAX_ITEM_QUANTITY}`;
    }
  }
  return null;
}

/**
 * PUT /store/custom/carts/:id/sync  { items: [{ variant_id, quantity }] }
 * Lleva el carrito al estado deseado (quantity 0 o ausente = eliminar) y aplica
 * el mayoreo. Es idempotente: reenviar el mismo estado no cambia nada.
 */
export async function PUT(req: MedusaRequest<SyncBody>, res: MedusaResponse): Promise<void> {
  const { id } = req.params;
  const error = validateItems(req.body?.items);
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  const items = (req.body.items as DesiredCartItem[]).map((it) => ({
    variant_id: it.variant_id,
    quantity: it.quantity,
  }));

  const { result } = await syncCartItemsWorkflow(req.scope).run({
    input: { cart_id: id, items },
  });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "cart",
    fields: ["id", "currency_code", "items.*"],
    filters: { id },
  });
  const cart: any = data?.[0];
  const pricing = new Map(result.lines.map((l) => [l.id, l]));

  res.json({
    cart: {
      ...cart,
      items: (cart?.items ?? []).map((item: any) => ({
        ...item,
        retail_price: pricing.get(item.id)?.retail_price ?? null,
        wholesale_price: pricing.get(item.id)?.wholesale_price ?? null,
      })),
    },
    wholesale: result.wholesale,
    max_quantity: MAX_ITEM_QUANTITY,
    changes: result.changes,
  });
}
