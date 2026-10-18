import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Button, Container, Heading, Input, Label, Text, toast, usePrompt } from "@medusajs/ui";
import { useEffect, useState } from "react";

/**
 * Umbral global de mayoreo (pares mínimos sumando todo el carrito), en el
 * listado de productos. Usa GET/POST /admin/wholesale-settings; al guardar, el
 * backend también actualiza el min_quantity de todos los precios de mayoreo.
 * Resultados y errores se muestran solo como toast.
 */

type Blocked = {
  variant_id: string;
  variant_title: string | null;
  product_id: string | null;
  product_title: string | null;
  reason: string;
};

type SaveResponse = {
  threshold: number;
  updated_prices: number;
  blocked: Blocked[];
};

type DryRunResponse = SaveResponse & { dry_run: true; current_threshold: number };

const ENDPOINT = "/admin/wholesale-settings";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? `Error ${res.status}`);
  return body as T;
}

const blockedLabel = (b: Blocked) =>
  [b.product_title, b.variant_title].filter(Boolean).join(" / ") || b.variant_id;

const blockedList = (blocked: Blocked[]) => (
  <ul className="list-disc pl-4">
    {blocked.map((b) => (
      <li key={b.variant_id}>
        <strong>{blockedLabel(b)}</strong>: {b.reason}
      </li>
    ))}
  </ul>
);

const WholesaleSettingsWidget = () => {
  const [current, setCurrent] = useState<number | null>(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const prompt = usePrompt();

  useEffect(() => {
    let active = true;
    request<{ threshold: number }>(ENDPOINT)
      .then(({ threshold }) => {
        if (!active) return;
        setCurrent(threshold);
        setValue(String(threshold));
      })
      .catch((e: Error) => {
        if (active) toast.error("No se pudo cargar el mínimo de mayoreo", { description: e.message });
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    const threshold = Number(value);
    if (!Number.isInteger(threshold) || threshold < 2 || threshold > 9999) {
      toast.error("Escribe un número entero entre 2 y 9999.");
      return;
    }

    setSaving(true);
    try {
      const body = JSON.stringify({ threshold });
      // Primero se calcula cuántos precios cambiarán, sin aplicar nada.
      const preview = await request<DryRunResponse>(`${ENDPOINT}?dry_run=true`, {
        method: "POST",
        body,
      });
      const ok = await prompt({
        variant: "confirmation",
        title: "Cambiar el mínimo de pares para mayoreo",
        description:
          `El mínimo pasará de ${preview.current_threshold} a ${threshold} pares. ` +
          "Se actualizará para todos los productos actuales y sus variantes (tallas). ¿Continuar?",
        confirmText: "Guardar",
        cancelText: "Cancelar",
      });
      if (!ok) return;

      const result = await request<SaveResponse>(ENDPOINT, { method: "POST", body });
      setCurrent(result.threshold);
      setValue(String(result.threshold));
      toast.success(`Mínimo de mayoreo: ${result.threshold} pares`, {
        description: `${result.updated_prices} precio(s) de mayoreo actualizado(s).`,
      });
      if (result.blocked.length) {
        toast.warning(`${result.blocked.length} variante(s) no se actualizaron`, {
          description: blockedList(result.blocked),
          duration: 15000,
        });
      }
    } catch (e) {
      toast.error("No se guardó el mínimo de mayoreo", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const changed = current !== null && value !== "" && Number(value) !== current;

  return (
    <Container className="flex flex-col gap-3 px-6 py-4">
      <div className="flex flex-col gap-1">
        <Heading level="h2">Mayoreo</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Se suman los pares de todo el carrito; al llegar al mínimo, cada producto usa su precio
          de mayoreo.
        </Text>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="wholesale-threshold" size="small">
            Mínimo de pares para mayoreo
          </Label>
          <Input
            id="wholesale-threshold"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            size="small"
            className="w-32"
            placeholder={current === null ? "Cargando..." : undefined}
            value={value}
            disabled={current === null || saving}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && changed) save();
            }}
          />
        </div>
        <Button size="small" variant="secondary" isLoading={saving} disabled={!changed} onClick={save}>
          Guardar
        </Button>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.list.before",
});

export default WholesaleSettingsWidget;
