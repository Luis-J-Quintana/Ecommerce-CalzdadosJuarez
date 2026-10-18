import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { summarizeWholesale } from "../../../../../../lib/cart-wholesale";
import { getWholesaleThreshold } from "../../../../../../lib/wholesale-settings";

// TODO: add new http methods for: POST the increment/decrement of a product in the cart, 
// DELETE(maybe we should use a flag to "delete" the product instead to use the delete method)

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse 
): Promise<void> {
  const { id } = req.params;
  const cartModuleService = req.scope.resolve(Modules.CART);

  const cart = await cartModuleService.retrieveCart(id, {
    relations: ["items"],
  });

  // Umbral global (módulo wholesale-settings); la respuesta conserva su forma.
  const threshold = await getWholesaleThreshold(req.scope);
  const summary = summarizeWholesale(cart.items ?? [], threshold);

  res.json({
    total_pairs: summary.total_pairs,
    wholesale_applied: summary.applied,
    threshold: summary.threshold,
    pairs_remaining: summary.pairs_remaining,
    wholesale_label: summary.wholesale_label,
  });
}