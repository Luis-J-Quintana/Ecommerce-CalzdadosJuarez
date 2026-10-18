import { model } from "@medusajs/framework/utils";
import { DEFAULT_WHOLESALE_THRESHOLD } from "../constants";

/**
 * Ajustes globales de mayoreo. Se usa como tabla de una sola fila: el servicio
 * lee la primera (por created_at) y la crea si no existe.
 */
const WholesaleSetting = model.define("wholesale_setting", {
  id: model.id({ prefix: "whset" }).primaryKey(),
  /** Pares mínimos (sumando todo el carrito) para aplicar el mayoreo. */
  threshold: model.number().default(DEFAULT_WHOLESALE_THRESHOLD),
});

export default WholesaleSetting;
