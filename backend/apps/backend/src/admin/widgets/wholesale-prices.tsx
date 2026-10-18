import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types";
import { Button, Container, Heading, Input, Label, Text, toast } from "@medusajs/ui";
import { useEffect, useState } from "react";

/**
 * Precio de mayoreo por variante (precio MXN sin reglas con min_quantity).
 * Usa GET/POST /admin/variants/:id/wholesale-price; el mínimo de pares lo
 * devuelve la API, así que aquí no se repite.
 */

type WholesaleInfo = {
  variant_id: string;
  currency_code: string;
  min_quantity: number;
  retail_amount: number | null;
  retail_count: number;
  wholesale_amount: number | null;
  warnings?: string[];
};

const endpoint = (variantId: string) => `/admin/variants/${variantId}/wholesale-price`;

async function request(variantId: string, init?: RequestInit): Promise<WholesaleInfo> {
  const res = await fetch(endpoint(variantId), {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message ?? `Error ${res.status}`);
  }
  return body as WholesaleInfo;
}

const money = (amount: number | null, currency: string) =>
  amount == null ? "—" : `$${amount.toFixed(2)} ${currency.toUpperCase()}`;

type VariantRowProps = {
  variantId: string;
  title: string;
};

const VariantRow = ({ variantId, title }: VariantRowProps) => {
  const [info, setInfo] = useState<WholesaleInfo | null>(null);
  const [value, setValue] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const apply = (data: WholesaleInfo) => {
    setInfo(data);
    setValue(data.wholesale_amount == null ? "" : String(data.wholesale_amount));
  };

  useEffect(() => {
    request(variantId)
      .then(apply)
      .catch((e: Error) => setLoadError(e.message));
  }, [variantId]);

  const save = async () => {
    const trimmed = value.trim();
    const amount = trimmed === "" ? null : Number(trimmed);
    if (amount !== null && !(Number.isFinite(amount) && amount > 0)) {
      toast.error("Escribe un número mayor que 0, o déjalo vacío para quitar el mayoreo.");
      return;
    }

    setSaving(true);
    try {
      const data = await request(variantId, {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      apply(data);
      data.warnings?.forEach((w) => toast.warning(w));
      toast.success(
        amount === null ? `${title}: mayoreo eliminado` : `${title}: mayoreo guardado`
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const inputId = `wholesale-${variantId}`;
  const minQuantity = info?.min_quantity;
  const changed =
    info != null &&
    value.trim() !== (info.wholesale_amount == null ? "" : String(info.wholesale_amount));

  return (
    <div className="flex flex-col gap-2 px-6 py-4 md:flex-row md:items-end md:gap-4">
      <div className="flex min-w-[140px] flex-col">
        <Text size="small" weight="plus">
          {title}
        </Text>
        <Text size="small" className="text-ui-fg-subtle">
          Normal: {info ? money(info.retail_amount, info.currency_code) : "…"}
        </Text>
        {info && info.retail_count > 1 && (
          <Text size="small" className="text-ui-fg-error">
            Hay {info.retail_count} precios normales; revisa los precios de la variante.
          </Text>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <Label htmlFor={inputId} size="small">
          Precio de mayoreo{minQuantity ? ` (${minQuantity}+ pares)` : ""}
        </Label>
        <Input
          id={inputId}
          type="number"
          min={0}
          step="0.01"
          size="small"
          placeholder="Sin mayoreo"
          value={value}
          disabled={!info || saving}
          onChange={(e) => setValue(e.target.value)}
        />
        {loadError && (
          <Text size="small" className="text-ui-fg-error">
            {loadError}
          </Text>
        )}
      </div>

      <Button
        size="small"
        variant="secondary"
        isLoading={saving}
        disabled={!info || !changed}
        onClick={save}
      >
        Guardar
      </Button>
    </div>
  );
};

type SimpleVariant = { id: string; title: string | null; sku: string | null };

const WholesalePricesWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const [variants, setVariants] = useState<SimpleVariant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/admin/products/${product.id}?fields=id,variants.id,variants.title,variants.sku`, {
      credentials: "include",
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.message ?? `Error ${res.status}`);
        return body;
      })
      .then((body) => {
        if (active) setVariants(body.product?.variants ?? []);
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [product.id]);

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-1 px-6 py-4">
        <Heading level="h2">Precios de mayoreo</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Deja el campo vacío y guarda para quitar el mayoreo de una variante.
        </Text>
      </div>
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
        variants.map((v) => (
          <VariantRow key={v.id} variantId={v.id} title={v.title ?? v.sku ?? v.id} />
        ))
      )}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default WholesalePricesWidget;
