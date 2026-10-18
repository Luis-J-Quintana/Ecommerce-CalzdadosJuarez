import type { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  VARIANT_PRICE_FIELDS,
  isWholesalePrice,
  type VariantWithPrices,
} from "../../../../../lib/wholesale-pricing";
import { getWholesaleThreshold } from "../../../../../lib/wholesale-settings";

const MAX_PRODUCT_IDS = 100;

type ProductRow = {
  id: string;
  sales_channels?: { id: string }[] | null;
  variants?: VariantWithPrices[] | null;
};

/** product_ids=a,b,c (también acepta el parámetro repetido). Sin vacíos ni repetidos. */
function parseProductIds(raw: unknown): string[] {
  const parts = (Array.isArray(raw) ? raw : [raw])
    .filter((v): v is string => typeof v === "string")
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
  return [...new Set(parts)];
}

/**
 * GET /store/custom/products/wholesale?product_ids=a,b,c
 * Menor precio de mayoreo (MXN sin reglas con min_quantity > 1) entre las
 * variantes de cada producto, para mostrarlo en el catálogo. Omite los
 * productos sin mayoreo, los no publicados y los que no están en un canal de
 * venta de la publishable key.
 */
export async function GET(req: MedusaStoreRequest, res: MedusaResponse): Promise<void> {
  const ids = parseProductIds(req.query.product_ids);
  if (!ids.length) {
    res.status(400).json({ message: "product_ids es obligatorio (ids separados por comas)" });
    return;
  }
  if (ids.length > MAX_PRODUCT_IDS) {
    res.status(400).json({
      message: `product_ids admite como máximo ${MAX_PRODUCT_IDS} ids (llegaron ${ids.length})`,
    });
    return;
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "sales_channels.id",
      ...VARIANT_PRICE_FIELDS.map((f) => `variants.${f}`),
    ],
    filters: { id: ids, status: "published" },
  });

  // Canales de la publishable key (los pone el middleware ensure-publishable-api-key).
  const channelIds = new Set(req.publishable_key_context?.sales_channel_ids ?? []);
  const inKeyChannels = (p: ProductRow) =>
    channelIds.size === 0 || (p.sales_channels ?? []).some((sc) => channelIds.has(sc.id));

  const byId = new Map((data as ProductRow[]).map((p) => [p.id, p]));
  const products = ids.flatMap((id) => {
    const product = byId.get(id);
    if (!product || !inKeyChannels(product)) return [];
    const amounts = (product.variants ?? []).flatMap((v) =>
      (v.price_set?.prices ?? []).filter(isWholesalePrice).map((p) => Number(p.amount))
    );
    return amounts.length ? [{ product_id: id, wholesale_price: Math.min(...amounts) }] : [];
  });

  res.json({ threshold: await getWholesaleThreshold(req.scope), products });
}
