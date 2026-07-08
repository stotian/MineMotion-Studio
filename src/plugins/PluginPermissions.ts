export type PluginPermission =
  | "registerTemplates"
  | "registerPresets"
  | "registerImporters"
  | "registerExporters"
  | "registerTools";

export const KNOWN_PLUGIN_PERMISSIONS: PluginPermission[] = [
  "registerTemplates",
  "registerPresets",
  "registerImporters",
  "registerExporters",
  "registerTools"
];

