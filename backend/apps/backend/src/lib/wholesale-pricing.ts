import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Lógica compartida del precio de mayoreo.
 *
 * Modelo: por variante, el mayoreo es un precio MXN sin reglas con
 * min_quantity = WHOLESALE_MIN_QUANTITY; el normal es el precio MXN sin reglas
 * y sin min_quantity. Los precios con reglas (región u otras) y los de listas
 * de precios nunca se modifican ni eliminan.
 *
 * updateProductVariantsWorkflow REEMPLAZA los precios del price set, así que el
 * plan reenvía todos los precios que se conservan, por id y sin `rules` (con eso
 * el módulo de precios deja sus reglas intactas).
 */

export const WHOLESALE_MIN_QUANTITY = 15;
export const WHOLESALE_CURRENCY = "mxn";
/** Cantidad máxima por línea que acepta PUT /store/custom/carts/:id/sync. */
export const MAX_ITEM_QUANTITY = 9999;

/** Campos de query.graph necesarios para planear precios de una variante. */
export const VARIANT_PRICE_FIELDS = [
  "id",
  "title",
  "sku",
  "price_set.id",
  "price_set.prices.id",
  "price_set.prices.amount",
  "price_set.prices.currency_code",
  "price_set.prices.min_quantity",
  "price_set.prices.max_quantity",
  "price_set.prices.price_list_id",
  "price_set.prices.rules_count",
  "price_set.prices.price_rules.attribute",
  "price_set.prices.price_rules.value",
];

export type PriceRow = {
  id: string;
  amount: number | string;
  currency_code: string;
  min_quantity?: number | string | null;
  max_quantity?: number | string | null;
  price_list_id?: string | null;
  rules_count?: number | null;
  price_rules?: { attribute: string; value: string }[] | null;
};

export type VariantWithPrices = {
  id: string;
  title?: string | null;
  sku?: string | null;
  price_set?: { id: string; prices?: PriceRow[] | null } | null;
};

type PriceInput = {
  id?: string;
  currency_code: string;
  amount: number;
  min_quantity?: number;
  max_quantity?: number;
};

export type PriceTarget = {
  /** Monto del precio normal; undefined = no tocar el normal existente. */
  retailAmount?: number;
  /** Monto del mayoreo; null = eliminar solo el precio de mayoreo. */
  wholesaleAmount: number | null;
};

export type VariantPricePlan =
  | { status: "unchanged"; variantId: string; warnings: string[] }
  | { status: "skip"; variantId: string; reason: string; warnings: string[] }
  | {
      status: "update";
      variantId: string;
      prices: PriceInput[];
      changes: string[];
      warnings: string[];
    };

// ---------- Clasificación ----------
const isMxn = (p: PriceRow) =>
  (p.currency_code || "").toLowerCase() === WHOLESALE_CURRENCY;
export const hasRules = (p: PriceRow) =>
  (p.price_rules?.length ?? 0) > 0 || Number(p.rules_count) > 0;
const isPriceListPrice = (p: PriceRow) => p.price_list_id != null;
const isBase = (p: PriceRow) => isMxn(p) && !hasRules(p) && !isPriceListPrice(p);

export const isRetailPrice = (p: PriceRow) =>
  isBase(p) && p.min_quantity == null && p.max_quantity == null;
export const isWholesalePrice = (p: PriceRow) =>
  isBase(p) &&
  Number(p.min_quantity) === WHOLESALE_MIN_QUANTITY &&
  p.max_quantity == null;

/** Precios del price set que el workflow reemplaza (excluye listas de precios). */
const priceSetPrices = (v: VariantWithPrices) =>
  (v.price_set?.prices ?? []).filter((p) => !isPriceListPrice(p));

export function describePrice(p: PriceRow): string {
  const rules = p.price_rules?.length
    ? p.price_rules.map((r) => `${r.attribute}=${r.value}`).join(", ")
    : Number(p.rules_count) > 0
      ? `${p.rules_count} regla(s)`
      : "sin reglas";
  return (
    `${p.id} | ${p.currency_code} ${Number(p.amount)} | ` +
    `min_quantity=${p.min_quantity ?? "null"}` +
    (p.max_quantity != null ? ` max_quantity=${p.max_quantity}` : "") +
    ` | ${rules}` +
    (isPriceListPrice(p) ? ` | lista ${p.price_list_id}` : "")
  );
}

/** Precio de mayoreo y normal actuales (solo los MXN sin reglas). */
export function readWholesale(variant: VariantWithPrices) {
  const prices = priceSetPrices(variant);
  const retail = prices.filter(isRetailPrice);
  const wholesale = prices.filter(isWholesalePrice);
  return {
    retail: retail.length === 1 ? Number(retail[0].amount) : null,
    retailCount: retail.length,
    wholesale: wholesale[0] ? Number(wholesale[0].amount) : null,
    wholesaleId: wholesale[0]?.id ?? null,
  };
}

const keep = (p: PriceRow): PriceInput => ({
  id: p.id,
  currency_code: p.currency_code,
  amount: Number(p.amount),
  ...(p.min_quantity != null && { min_quantity: Number(p.min_quantity) }),
  ...(p.max_quantity != null && { max_quantity: Number(p.max_quantity) }),
});

// ---------- Planeación ----------
/**
 * Calcula la lista completa de precios a enviar al workflow para una variante.
 * No lanza: los casos no aplicables vuelven como "skip" con el motivo.
 */
export function planVariantPrices(
  variant: VariantWithPrices,
  target: PriceTarget
): VariantPricePlan {
  const variantId = variant.id;
  const warnings: string[] = [];

  if (!variant.price_set) {
    return { status: "skip", variantId, reason: "sin price_set", warnings };
  }

  const prices = priceSetPrices(variant);
  const retail = prices.filter(isRetailPrice);
  const wholesale = prices.filter(isWholesalePrice);

  if (retail.length > 1) {
    return {
      status: "skip",
      variantId,
      reason:
        `tiene ${retail.length} precios MXN sin reglas y sin min_quantity ` +
        `(${retail.map((p) => p.id).join(", ")}); resuélvelo a mano`,
      warnings,
    };
  }

  const currentRetail = retail[0] ? Number(retail[0].amount) : null;
  const retailAmount = target.retailAmount ?? currentRetail;
  const { wholesaleAmount } = target;

  if (wholesaleAmount != null) {
    if (!(wholesaleAmount > 0)) {
      return { status: "skip", variantId, reason: "el mayoreo debe ser > 0", warnings };
    }
    if (retailAmount == null) {
      return {
        status: "skip",
        variantId,
        reason: "no hay precio normal MXN sin reglas con el cual comparar el mayoreo",
        warnings,
      };
    }
    if (wholesaleAmount >= retailAmount) {
      return {
        status: "skip",
        variantId,
        reason: `el mayoreo (${wholesaleAmount}) debe ser menor que el normal (${retailAmount})`,
        warnings,
      };
    }
  }

  if (wholesale.length > 1) {
    warnings.push(
      `se eliminan ${wholesale.length - 1} precio(s) de mayoreo duplicados: ` +
        wholesale.slice(1).map((p) => p.id).join(", ")
    );
  }
  const otherBase = prices.filter(
    (p) => isBase(p) && !isRetailPrice(p) && !isWholesalePrice(p)
  );
  if (otherBase.length) {
    warnings.push(
      `se conservan ${otherBase.length} precio(s) MXN sin reglas con otros mínimos/máximos: ` +
        otherBase.map((p) => p.id).join(", ")
    );
  }

  const retailOk = target.retailAmount === undefined || currentRetail === target.retailAmount;
  const wholesaleOk =
    wholesaleAmount == null
      ? wholesale.length === 0
      : wholesale.length === 1 && Number(wholesale[0].amount) === wholesaleAmount;
  if (retailOk && wholesaleOk) {
    return { status: "unchanged", variantId, warnings };
  }

  const changes: string[] = [];
  const next: PriceInput[] = prices
    .filter((p) => !isRetailPrice(p) && !isWholesalePrice(p))
    .map(keep);

  if (retailAmount != null) {
    next.push({
      ...(retail[0] && { id: retail[0].id }),
      currency_code: WHOLESALE_CURRENCY,
      amount: retailAmount,
    });
    if (!retailOk) changes.push(`normal: ${currentRetail ?? "ninguno"} -> ${retailAmount}`);
  }

  const currentWholesale = wholesale[0] ? Number(wholesale[0].amount) : null;
  if (wholesaleAmount != null) {
    next.push({
      ...(wholesale[0] && { id: wholesale[0].id }),
      currency_code: WHOLESALE_CURRENCY,
      amount: wholesaleAmount,
      min_quantity: WHOLESALE_MIN_QUANTITY,
    });
  }
  if (!wholesaleOk) {
    changes.push(
      `mayoreo (min ${WHOLESALE_MIN_QUANTITY}): ${currentWholesale ?? "ninguno"} -> ` +
        `${wholesaleAmount ?? "eliminado"}`
    );
  }

  return { status: "update", variantId, prices: next, changes, warnings };
}

// ---------- IO ----------
export async function fetchVariantsWithPrices(
  container: MedusaContainer,
  filters: Record<string, unknown>
): Promise<VariantWithPrices[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "product_variant",
    fields: VARIANT_PRICE_FIELDS,
    filters,
  });
  return data as VariantWithPrices[];
}

/** Aplica en una sola ejecución del workflow los planes con status "update". */
export async function applyVariantPricePlans(
  container: MedusaContainer,
  plans: VariantPricePlan[]
) {
  const product_variants = plans.flatMap((p) =>
    p.status === "update" ? [{ id: p.variantId, prices: p.prices }] : []
  );
  if (!product_variants.length) return;
  await updateProductVariantsWorkflow(container).run({
    input: { product_variants },
  });
}
