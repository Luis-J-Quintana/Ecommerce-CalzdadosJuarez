import { Module } from "@medusajs/framework/utils";
import WholesaleSettingsModuleService from "./service";
import { WHOLESALE_SETTINGS_MODULE } from "./constants";

export { WHOLESALE_SETTINGS_MODULE };
export type { WholesaleSettingsModuleService };

export default Module(WHOLESALE_SETTINGS_MODULE, {
  service: WholesaleSettingsModuleService,
});
