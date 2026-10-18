/** Clave del módulo en el contenedor (y nombre para `medusa db:generate`). */
export const WHOLESALE_SETTINGS_MODULE = "wholesaleSettings";

/** Umbral de pares por defecto, si todavía no hay fila de ajustes. */
export const DEFAULT_WHOLESALE_THRESHOLD = 15;

/** Límites que acepta POST /admin/wholesale-settings. */
export const MIN_WHOLESALE_THRESHOLD = 2;
export const MAX_WHOLESALE_THRESHOLD = 9999;
