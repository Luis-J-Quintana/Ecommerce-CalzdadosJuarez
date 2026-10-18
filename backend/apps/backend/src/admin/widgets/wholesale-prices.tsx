import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types";
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui";
import { useEffect, useState } from "react";

/**
 * Precio normal y de mayoreo por variante (precios MXN sin reglas; el mayoreo
 * con min_quantity). Usa:
 * - GET/POST /admin/products/:id/wholesale-prices (lista y "aplicar a todas")
 * - POST /admin/variants/:id/wholesale-price (guardar una variante)
 * El mínimo de pares lo devuelve la API, así que aquí no se repite.
 */

type VariantPrices = {
  variant_id: string;
  title: string | null;
  sku: string | null;
  currency_code: string;
  min_quantity: number;
  retail_amount: number | null;
  retail_count: number;
  wholesale_amount: number | null;
  wholesale_count: number;
};

type VariantIssue = { variant_id: string; title: string; reason: string };

type BulkResponse = {
  updated: number;
  unchanged: number;
  skipped: VariantIssue[];
  warnings: { variant_id: string; title: string; messages: string[] }[];
  variants: VariantPrices[];
};

type VariantResponse = VariantPrices & { updated: boolean; warnings: string[] };

class ApiError extends Error {
  constructor(
    message: string,
    public conflicts: VariantIssue[] = []
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.message ?? `Error ${res.status}`, body.conflicts ?? []);
  }
  return body as T;
}

const productEndpoint = (productId: string) => `/admin/products/${productId}/wholesale-prices`;
const variantEndpoint = (variantId: string) => `/admin/variants/${variantId}/wholesale-price`;

const asText = (amount: number | null) => (amount == null ? "" : String(amount));
const variantLabel = (v: VariantPrices) => v.title ?? v.sku ?? v.variant_id;
const isBlocked = (v: VariantPrices) => v.retail_count > 1 || v.wholesale_count > 1;

/** Texto del campo → número > 0, null si está vacío, o undefined si no es válido. */
function parseAmount(text: string): number | null | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

const issueList = (items: { title: string; text: string }[]) => (
  <ul className="list-disc pl-4">
    {items.map((i, idx) => (
      <li key={idx}>
        <strong>{i.title}</strong>: {i.text}
      </li>
    ))}
  </ul>
);

/** Muestra el resultado de una petición en toasts (actualizadas, omitidas, avisos). */
function reportResult(updated: number, skipped: VariantIssue[], warnings: BulkResponse["warnings"]) {
  if (updated > 0) {
    toast.success(`${updated} variante(s) actualizada(s)`);
  } else if (!skipped.length) {
    toast.info("Sin cambios: los precios ya tenían esos valores");
  }
  if (skipped.length) {
    toast.warning(`${skipped.length} variante(s) no se actualizaron`, {
      description: issueList(skipped.map((s) => ({ title: s.title, text: s.reason }))),
      duration: 15000,
    });
  }
  if (warnings.length) {
    toast.warning("Avisos", {
      description: issueList(
        warnings.map((w) => ({ title: w.title, text: w.messages.join("; ") }))
      ),
      duration: 15000,
    });
  }
}

// ---------- Fila por variante ----------
type VariantRowProps = {
  info: VariantPrices;
  onSaved: (info: VariantPrices) => void;
};

const VariantRow = ({ info, onSaved }: VariantRowProps) => {
  const [retail, setRetail] = useState(asText(info.retail_amount));
  const [wholesale, setWholesale] = useState(asText(info.wholesale_amount));
  const [saving, setSaving] = useState(false);
  const title = variantLabel(info);

  // Si cambian los valores guardados (p. ej. tras "aplicar a todas"), se reflejan en los campos.
  useEffect(() => {
    setRetail(asText(info.retail_amount));
    setWholesale(asText(info.wholesale_amount));
  }, [info.retail_amount, info.wholesale_amount]);

  const changed =
    retail.trim() !== asText(info.retail_amount) ||
    wholesale.trim() !== asText(info.wholesale_amount);

  const save = async () => {
    const retailAmount = parseAmount(retail);
    const wholesaleAmount = parseAmount(wholesale);
    if (retailAmount === undefined || (retailAmount === null && info.retail_amount != null)) {
      toast.error(`${title}: no se guardó`, {
        description: "El precio normal debe ser un número mayor que 0.",
      });
      return;
    }
    if (wholesaleAmount === undefined) {
      toast.error(`${title}: no se guardó`, {
        description: "El mayoreo debe ser un número mayor que 0, o vacío para quitarlo.",
      });
      return;
    }

    setSaving(true);
    try {
      const data = await request<VariantResponse>(variantEndpoint(info.variant_id), {
        method: "POST",
        body: JSON.stringify({
          ...(retailAmount !== null && { retail_amount: retailAmount }),
          wholesale_amount: wholesaleAmount,
        }),
      });
      const { updated, warnings, ...prices } = data;
      onSaved(prices);
      reportResult(
        updated ? 1 : 0,
        [],
        warnings.length ? [{ variant_id: info.variant_id, title, messages: warnings }] : []
      );
    } catch (e) {
      toast.error(`${title}: no se guardó`, { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const id = (field: string) => `${field}-${info.variant_id}`;

  return (
    <div className="flex flex-col gap-2 px-6 py-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
        <Text size="small" weight="plus" className="min-w-[140px] md:pb-2">
          {title}
        </Text>
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor={id("retail")} size="small">
            Precio normal
          </Label>
          <Input
            id={id("retail")}
            type="number"
            min={0}
            step="0.01"
            size="small"
            placeholder="Sin precio normal"
            value={retail}
            disabled={saving}
            onChange={(e) => setRetail(e.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor={id("wholesale")} size="small">
            Precio de mayoreo ({info.min_quantity}+ pares)
          </Label>
          <Input
            id={id("wholesale")}
            type="number"
            min={0}
            step="0.01"
            size="small"
            placeholder="Sin mayoreo"
            value={wholesale}
            disabled={saving}
            onChange={(e) => setWholesale(e.target.value)}
          />
        </div>
        <Button
          size="small"
          variant="secondary"
          isLoading={saving}
          disabled={!changed}
          onClick={save}
        >
          Guardar
        </Button>
      </div>
      {info.retail_count > 1 && (
        <Text size="small" className="text-ui-fg-error">
          Hay {info.retail_count} precios normales; no se puede guardar hasta dejar uno.
        </Text>
      )}
      {info.wholesale_count > 1 && (
        <Text size="small" className="text-ui-fg-error">
          Hay {info.wholesale_count} precios de mayoreo; no se puede guardar hasta dejar uno.
        </Text>
      )}
    </div>
  );
};

// ---------- Aplicar a todas ----------
type BulkControlProps = {
  kind: "retail" | "wholesale";
  label: string;
  variants: VariantPrices[];
  busy: boolean;
  onApply: (kind: "retail" | "wholesale", amount: number) => Promise<boolean>;
};

const BulkControl = ({ kind, label, variants, busy, onApply }: BulkControlProps) => {
  const [value, setValue] = useState("");
  const prompt = usePrompt();
  const inputId = `bulk-${kind}`;

  const submit = async () => {
    const amount = parseAmount(value);
    if (amount == null) {
      toast.error("Escribe un número mayor que 0.");
      return;
    }
    const current = (v: VariantPrices) =>
      kind === "retail" ? v.retail_amount : v.wholesale_amount;
    const toChange = variants.filter((v) => !isBlocked(v) && current(v) !== amount).length;
    const blocked = variants.filter(isBlocked).length;
    if (toChange === 0) {
      toast.info("Todas las variantes ya tienen ese precio.");
      return;
    }
    const ok = await prompt({
      variant: "confirmation",
      title: "Aplicar precio a todas las variantes",
      description:
        `Se modificará el precio ${kind === "retail" ? "normal" : "de mayoreo"} de ` +
        `${toChange} de ${variants.length} variante(s) a ${amount}.` +
        (blocked ? ` ${blocked} variante(s) con precios duplicados se omitirán.` : "") +
        " ¿Continuar?",
      confirmText: "Aplicar",
      cancelText: "Cancelar",
    });
    if (!ok) return;
    if (await onApply(kind, amount)) setValue("");
  };

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={inputId} size="small">
        {kind === "retail" ? "Precio normal" : "Precio de mayoreo"}
      </Label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          type="number"
          min={0}
          step="0.01"
          size="small"
          value={value}
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button
          size="small"
          variant="secondary"
          isLoading={busy}
          disabled={value.trim() === "" || variants.length === 0}
          onClick={submit}
        >
          {label}
        </Button>
      </div>
    </div>
  );
};

// ---------- Widget ----------
const WholesalePricesWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const [variants, setVariants] = useState<VariantPrices[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    let active = true;
    request<{ variants: VariantPrices[] }>(productEndpoint(product.id))
      .then((body) => {
        if (active) setVariants(body.variants);
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [product.id]);

  const replaceVariant = (info: VariantPrices) =>
    setVariants((prev) =>
      prev ? prev.map((v) => (v.variant_id === info.variant_id ? info : v)) : prev
    );

  const applyToAll = async (kind: "retail" | "wholesale", amount: number) => {
    setBulkBusy(true);
    try {
      const data = await request<BulkResponse>(productEndpoint(product.id), {
        method: "POST",
        body: JSON.stringify(
          kind === "retail" ? { retail_amount: amount } : { wholesale_amount: amount }
        ),
      });
      setVariants(data.variants);
      reportResult(data.updated, data.skipped, data.warnings);
      return true;
    } catch (e) {
      const err = e as ApiError;
      if (err.conflicts?.length) {
        toast.error("No se aplicó ningún cambio", {
          description: issueList(err.conflicts.map((c) => ({ title: c.title, text: c.reason }))),
          duration: 15000,
        });
      } else {
        toast.error(err.message);
      }
      return false;
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-1 px-6 py-4">
        <Heading level="h2">Precios de mayoreo</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Edita aquí los precios MXN de cada variante (no con el editor de precios nativo, que
          borra el mayoreo). Deja el mayoreo vacío y guarda para quitarlo.
        </Text>
      </div>

      {variants && variants.length > 0 && (
        <div className="flex flex-col gap-3 px-6 py-4">
          <Text size="small" weight="plus">
            Aplicar a todas las variantes
          </Text>
          <div className="grid gap-3 md:grid-cols-2">
            <BulkControl
              kind="retail"
              label="Aplicar el mismo precio normal a todas las variantes"
              variants={variants}
              busy={bulkBusy}
              onApply={applyToAll}
            />
            <BulkControl
              kind="wholesale"
              label="Aplicar el mismo precio de mayoreo a todas las variantes"
              variants={variants}
              busy={bulkBusy}
              onApply={applyToAll}
            />
          </div>
        </div>
      )}

      {error ? (
        <Text size="small" className="px-6 py-4 text-ui-fg-error">
          No se pudieron cargar las variantes: {error}
        </Text>
      ) : variants === null ? (
        <Text size="small" className="px-6 py-4 text-ui-fg-subtle">
          Cargando...
        </Text>
      ) : variants.length === 0 ? (
        <Text size="small" className="px-6 py-4 text-ui-fg-subtle">
          Este producto no tiene variantes.
        </Text>
      ) : (
        variants.map((v) => <VariantRow key={v.variant_id} info={v} onSaved={replaceVariant} />)
      )}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default WholesalePricesWidget;
