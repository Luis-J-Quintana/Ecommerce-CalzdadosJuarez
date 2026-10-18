import { MedusaService } from "@medusajs/framework/utils";
import WholesaleSetting from "./models/wholesale-setting";
import { DEFAULT_WHOLESALE_THRESHOLD } from "./constants";

class WholesaleSettingsModuleService extends MedusaService({ WholesaleSetting }) {
  private async getRow() {
    const [row] = await this.listWholesaleSettings(
      {},
      { take: 1, order: { created_at: "ASC" } }
    );
    return row ?? null;
  }

  /** Umbral actual; DEFAULT_WHOLESALE_THRESHOLD si no hay fila. */
  async getThreshold(): Promise<number> {
    const row = await this.getRow();
    return row ? Number(row.threshold) : DEFAULT_WHOLESALE_THRESHOLD;
  }

  /**
   * Guarda el umbral (crea la fila si no existe).
   * Devuelve el valor anterior, o null si no había fila.
   */
  async setThreshold(threshold: number): Promise<number | null> {
    const row = await this.getRow();
    if (row) {
      await this.updateWholesaleSettings({ id: row.id, threshold });
      return Number(row.threshold);
    }
    await this.createWholesaleSettings({ threshold });
    return null;
  }
}

export default WholesaleSettingsModuleService;
