import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

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
  (sum, item) => sum + Number(item.quantity),
  0
);

  // TODO: definir tus umbrales reales (3, 6, 12, 18 pares)
  const tiers = [
    { min: 18, label: "Precio mayoreo 18 pares surtidos" },
    { min: 12, label: "Precio mayoreo 12 pares surtidos" },
    { min: 6, label: "Precio mayoreo 6 pares surtidos" },
    { min: 3, label: "Precio mayoreo 3 pares surtidos" },
  ];

  const appliedTier = tiers.find((tier) => totalPairs >= tier.min);

  res.json({
    total_pairs: totalPairs,
    wholesale_label: appliedTier?.label ?? null,
  });
}