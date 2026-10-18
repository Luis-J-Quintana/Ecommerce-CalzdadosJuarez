import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  DEFAULT_WHOLESALE_THRESHOLD,
  MAX_WHOLESALE_THRESHOLD,
  MIN_WHOLESALE_THRESHOLD,
  WHOLESALE_SETTINGS_MODULE,
} from "../modules/wholesale-settings/constants";
import type WholesaleSettingsModuleService from "../modules/wholesale-settings/service";

export const isValidWholesaleThreshold = (v: unknown): v is number =>
  typeof v === "number" &&
  Number.isInteger(v) &&
  v >= MIN_WHOLESALE_THRESHOLD &&
  v <= MAX_WHOLESALE_THRESHOLD;

export const resolveWholesaleSettings = (container: MedusaContainer) =>
  container.resolve<WholesaleSettingsModuleService>(WHOLESALE_SETTINGS_MODULE);

/**
 * Umbral global de mayoreo (pares mínimos sumando todo el carrito).
 * Devuelve DEFAULT_WHOLESALE_THRESHOLD (15) si no hay fila de ajustes, si el
 * valor guardado no es válido o si no se puede leer (p. ej. migración sin correr).
 */
export async function getWholesaleThreshold(container: MedusaContainer): Promise<number> {
  try {
    const threshold = await resolveWholesaleSettings(container).getThreshold();
    return isValidWholesaleThreshold(threshold) ? threshold : DEFAULT_WHOLESALE_THRESHOLD;
  } catch (e) {
    container
      .resolve(ContainerRegistrationKeys.LOGGER)
      .warn(
        `No se pudo leer el umbral de mayoreo (${(e as Error).message}); ` +
          `se usa ${DEFAULT_WHOLESALE_THRESHOLD}.`
      );
    return DEFAULT_WHOLESALE_THRESHOLD;
  }
}
