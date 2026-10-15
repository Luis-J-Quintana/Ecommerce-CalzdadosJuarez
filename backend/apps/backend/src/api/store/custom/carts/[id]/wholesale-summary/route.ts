import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

// TODO: add new http methods for: POST the increment/decrement of a product in the cart, 
// DELETE(maybe we should use a flag to "delete" the product instead to use the delete method)
const WHOLESALE_THRESHOLD = 15;

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse 
): Promise<void> {
  const { id } = req.params;
  const cartModuleService = req.scope.resolve(Modules.CART);

  const cart = await cartModuleService.retrieveCart(id, {
    relations: ["items"],
  });

  const totalPairs = (cart.items ?? []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const isWholesale = totalPairs >= WHOLESALE_THRESHOLD;

  res.json({
    total_pairs: totalPairs,
    wholesale_applied: isWholesale,
    threshold: WHOLESALE_THRESHOLD,
    pairs_remaining: Math.max(0, WHOLESALE_THRESHOLD - totalPairs),
    wholesale_label: isWholesale ? "Precio de mayoreo (15+ pares)" : null,
  });
}