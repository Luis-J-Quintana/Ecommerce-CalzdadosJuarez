import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { applyCartWholesaleWorkflow } from "../../../../../../workflows/apply-cart-wholesale";

/**
 * POST /store/custom/carts/:id/sync-wholesale
 * Recalcula el unit_price de cada línea del carrito según el umbral global de
 * pares (WHOLESALE_THRESHOLD). La regla vive en src/lib/cart-wholesale.ts y se
 * aplica con el mismo paso que usa PUT /store/custom/carts/:id/sync.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params;
  const cartModuleService = req.scope.resolve(Modules.CART);

  const { result } = await applyCartWholesaleWorkflow(req.scope).run({
    input: { cart_id: id },
  });

  // Obtener carrito final con totales recalculados
  const updatedCart = await cartModuleService.retrieveCart(id, {
    relations: ["items"],
  });

  res.json({
    cart: updatedCart,
    wholesale: result.wholesale,
  });
}
