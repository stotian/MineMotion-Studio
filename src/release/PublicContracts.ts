import { CURRENT_PROJECT_SCHEMA_VERSION } from "../core/serialization/SchemaVersion";
import { MINEMOTION_PLUGIN_API_VERSION } from "../plugins/ExtensionTypes";
import { MINEMOTION_ZIP_SCHEMA_VERSION } from "../project/package/ZipPackageFormat";
export const V1_PUBLIC_CONTRACTS = Object.freeze({
  projectSchema: CURRENT_PROJECT_SCHEMA_VERSION,
  packageSchema: MINEMOTION_ZIP_SCHEMA_VERSION,
  pluginApi: MINEMOTION_PLUGIN_API_VERSION,
  templateSchema: 1,
  settingsSchema: 2,
  frozenFor: "1.0.0"
} as const);
export function validateV1PublicContracts(): string[] {
  const errors: string[] = [];
  if (V1_PUBLIC_CONTRACTS.projectSchema !== 10) errors.push("Project schema must remain 10 for v1.");
  if (V1_PUBLIC_CONTRACTS.packageSchema !== 1) errors.push("Package schema must remain 1 for v1.");
  if (V1_PUBLIC_CONTRACTS.pluginApi !== "1.0") errors.push("Plugin API must remain 1.0 for v1.");
  if (V1_PUBLIC_CONTRACTS.settingsSchema !== 2) errors.push("Settings schema must remain 2 for v1.");
  return errors;
}
