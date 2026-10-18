import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows";
import { DEFAULT_WHOLESALE_THRESHOLD } from "../modules/wholesale-settings/constants";

/**
 * Lógica compartida del precio de mayoreo.
 *
 * Modelo: por variante, el mayoreo es un precio MXN sin reglas con
 * min_quantity no nulo y mayor que 1 (al crearlo o sincronizarlo se usa el
 * umbral global, ver src/lib/wholesale-settings.ts); el normal es el precio MXN
 * sin reglas y sin min_quantity. Los precios con reglas (región u otras) y los
 * de listas de precios nunca se modifican ni eliminan.
 *
 * updateProductVariantsWorkflow REEMPLAZA los precios del price set, así que el
 * plan reenvía todos los precios que se conservan, por id y sin `rules` (con eso
 * el módulo de precios deja sus reglas intactas).
 */

/** Solo valor por defecto: el umbral real se lee con getWholesaleThreshold(container). */
export const WHOLESALE_MIN_QUANTITY = DEFAULT_WHOLESALE_THRESHOLD;
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
  /**
   * Monto del mayoreo; null = eliminar solo el precio de mayoreo;
   * undefined = conservar el mayoreo actual (y validarlo contra el normal nuevo).
   */
  wholesaleAmount?: number | null;
};

export type PlanOptions = {
  /**
   * Si es true, una variante con varios precios de mayoreo se omite como
   * "blocked" en lugar de fusionarlos (eliminar los sobrantes). Lo usan las
   * rutas de admin; el script seed-mayoreo.ts no lo pasa.
   */
  strictDuplicates?: boolean;
  /**
   * min_quantity con el que se crea o sincroniza el precio de mayoreo (umbral
   * global). Un mayoreo con otro min_quantity cuenta como cambio.
   * Por defecto WHOLESALE_MIN_QUANTITY.
   */
  threshold?: number;
};

/**
 * Motivo de una variante omitida:
 * - "conflict": el monto pedido no es válido para esa variante (p. ej. mayoreo >= normal).
 * - "blocked": la variante no se puede actualizar sin intervención manual
 *   (precios duplicados, sin price_set).
 */
export type SkipCode = "conflict" | "blocked";

export type VariantPricePlan =
  | { status: "unchanged"; variantId: string; warnings: string[] }
  | {
      status: "skip";
      variantId: string;
      code: SkipCode;
      reason: string;
      warnings: string[];
    }
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
/** MXN sin reglas ni lista, con min_quantity no nulo y > 1 (y sin max_quantity). */
export const isWholesalePrice = (p: PriceRow) =>
  isBase(p) &&
  p.min_quantity != null &&
  Number(p.min_quantity) > 1 &&
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
    wholesaleCount: wholesale.length,
    wholesaleId: wholesale[0]?.id ?? null,
    wholesaleMinQuantity: wholesale[0] ? Number(wholesale[0].min_quantity) : null,
  };
}

/**
 * Forma común de las respuestas de las rutas de admin de mayoreo.
 * `min_quantity` es el umbral global; `wholesale_min_quantity`, el que tiene
 * guardado el precio de mayoreo (difieren si quedó sin sincronizar).
 */
export function serializeVariantPrices(variant: VariantWithPrices, threshold: number) {
  const { retail, retailCount, wholesale, wholesaleCount, wholesaleMinQuantity } =
    readWholesale(variant);
  return {
    variant_id: variant.id,
    title: variant.title ?? null,
    sku: variant.sku ?? null,
    currency_code: WHOLESALE_CURRENCY,
    min_quantity: threshold,
    retail_amount: retail,
    retail_count: retailCount,
    wholesale_amount: wholesale,
    wholesale_count: wholesaleCount,
    wholesale_min_quantity: wholesaleMinQuantity,
  };
}

export type AmountsBody = {
  retail_amount?: unknown;
  wholesale_amount?: unknown;
  /** Alias anterior de wholesale_amount (ruta por variante). */
  amount?: unknown;
};

const isPositiveNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0;

/**
 * Valida { retail_amount?, wholesale_amount? } y lo convierte en PriceTarget.
 * Devuelve { error } con un mensaje para responder 400.
 */
export function parsePriceTarget(
  body: AmountsBody | undefined,
  { allowLegacyAmount = false } = {}
): { target: PriceTarget } | { error: string } {
  const retail = body?.retail_amount;
  let wholesale = body?.wholesale_amount;
  if (wholesale === undefined && allowLegacyAmount) wholesale = body?.amount;

  if (retail === undefined && wholesale === undefined) {
    return {
      error:
        "Envía retail_amount (número > 0) y/o wholesale_amount (número > 0, o null para eliminar el mayoreo)",
    };
  }
  if (retail !== undefined && !isPositiveNumber(retail)) {
    return { error: "retail_amount debe ser un número mayor que 0" };
  }
  if (wholesale !== undefined && wholesale !== null && !isPositiveNumber(wholesale)) {
    return { error: "wholesale_amount debe ser un número mayor que 0 o null" };
  }
  return {
    target: {
      ...(retail !== undefined && { retailAmount: retail }),
      ...(wholesale !== undefined && { wholesaleAmount: wholesale as number | null }),
    },
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
  target: PriceTarget,
  options: PlanOptions = {}
): VariantPricePlan {
  const variantId = variant.id;
  const threshold = options.threshold ?? WHOLESALE_MIN_QUANTITY;
  const warnings: string[] = [];
  const skip = (code: SkipCode, reason: string): VariantPricePlan => ({
    status: "skip",
    variantId,
    code,
    reason,
    warnings,
  });

  if (!variant.price_set) {
    return skip("blocked", "sin price_set");
  }

  const prices = priceSetPrices(variant);
  const retail = prices.filter(isRetailPrice);
  const wholesale = prices.filter(isWholesalePrice);

  if (retail.length > 1) {
    return skip(
      "blocked",
      `tiene ${retail.length} precios MXN sin reglas y sin min_quantity ` +
        `(${retail.map((p) => p.id).join(", ")}); resuélvelo a mano`
    );
  }
  if (options.strictDuplicates && wholesale.length > 1) {
    return skip(
      "blocked",
      `tiene ${wholesale.length} precios de mayoreo (MXN sin reglas con min_quantity > 1) ` +
        `(${wholesale.map((p) => p.id).join(", ")}); resuélvelo a mano`
    );
  }

  const currentRetail = retail[0] ? Number(retail[0].amount) : null;
  const currentWholesale = wholesale[0] ? Number(wholesale[0].amount) : null;
  if (target.retailAmount !== undefined && !(target.retailAmount > 0)) {
    return skip("conflict", "el precio normal debe ser > 0");
  }
  const retailAmount = target.retailAmount ?? currentRetail;
  // undefined = conservar el mayoreo actual, validándolo contra el normal resultante.
  const wholesaleAmount =
    target.wholesaleAmount === undefined ? currentWholesale : target.wholesaleAmount;

  if (wholesaleAmount != null) {
    if (!(wholesaleAmount > 0)) {
      return skip("conflict", "el mayoreo debe ser > 0");
    }
    if (retailAmount == null) {
      return skip(
        "conflict",
        "no hay precio normal MXN sin reglas con el cual comparar el mayoreo"
      );
    }
    if (wholesaleAmount >= retailAmount) {
      return skip(
        "conflict",
        `el mayoreo (${wholesaleAmount}) debe ser menor que el normal (${retailAmount})`
      );
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
      : wholesale.length === 1 &&
        Number(wholesale[0].amount) === wholesaleAmount &&
        Number(wholesale[0].min_quantity) === threshold;
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

  if (wholesaleAmount != null) {
    next.push({
      ...(wholesale[0] && { id: wholesale[0].id }),
      currency_code: WHOLESALE_CURRENCY,
      amount: wholesaleAmount,
      min_quantity: threshold,
    });
  }
  if (!wholesaleOk) {
    const currentMin = wholesale[0] ? ` (min ${wholesale[0].min_quantity})` : "";
    changes.push(
      `mayoreo: ${currentWholesale ?? "ninguno"}${currentMin} -> ` +
        (wholesaleAmount == null ? "eliminado" : `${wholesaleAmount} (min ${threshold})`)
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

export type VariantWithProduct = VariantWithPrices & {
  product?: { id: string; title?: string | null } | null;
};

/** Todas las variantes con sus precios, leídas por lotes (orden por id). */
export async function fetchAllVariantsWithPrices(
  container: MedusaContainer,
  batchSize = 200
): Promise<VariantWithProduct[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const all: VariantWithProduct[] = [];
  for (let skip = 0; ; skip += batchSize) {
    const { data } = await query.graph({
      entity: "product_variant",
      fields: [...VARIANT_PRICE_FIELDS, "product.id", "product.title"],
      pagination: { skip, take: batchSize, order: { id: "ASC" } },
    });
    all.push(...(data as VariantWithProduct[]));
    if (data.length < batchSize) return all;
  }
}

/** Entrada de updateProductVariantsWorkflow para los planes con status "update". */
export function toProductVariantUpdates(plans: VariantPricePlan[]) {
  return plans.flatMap((p) =>
    p.status === "update" ? [{ id: p.variantId, prices: p.prices }] : []
  );
}

export type ThresholdSyncBlocked = {
  variant_id: string;
  variant_title: string | null;
  product_id: string | null;
  product_title: string | null;
  reason: string;
};

/**
 * Plan para llevar el min_quantity de TODOS los precios de mayoreo al umbral
 * nuevo, sin cambiar montos. Solo considera variantes con al menos un precio de
 * mayoreo. Las que no se pueden actualizar (mayoreos o normales duplicados,
 * mayoreo sin normal o >= normal) no se tocan y vuelven en `blocked`.
 */
export function planWholesaleThresholdSync(
  variants: VariantWithProduct[],
  threshold: number
) {
  const plans: VariantPricePlan[] = [];
  const blocked: ThresholdSyncBlocked[] = [];

  for (const v of variants) {
    if (!priceSetPrices(v).some(isWholesalePrice)) continue;
    const plan = planVariantPrices(v, {}, { strictDuplicates: true, threshold });
    if (plan.status === "skip") {
      blocked.push({
        variant_id: v.id,
        variant_title: v.title ?? v.sku ?? null,
        product_id: v.product?.id ?? null,
        product_title: v.product?.title ?? null,
        reason: plan.reason,
      });
    } else {
      plans.push(plan);
    }
  }

  const product_variants = toProductVariantUpdates(plans);
  // Cada variante actualizada tiene exactamente un precio de mayoreo (strictDuplicates).
  return { product_variants, updated_prices: product_variants.length, blocked };
}

/** Aplica en una sola ejecución del workflow los planes con status "update". */
export async function applyVariantPricePlans(
  container: MedusaContainer,
  plans: VariantPricePlan[]
) {
  const product_variants = toProductVariantUpdates(plans);
  if (!product_variants.length) return;
  await updateProductVariantsWorkflow(container).run({
    input: { product_variants },
  });
}
