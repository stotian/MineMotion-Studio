export type PluginPermission =
  | "registerTemplates"
  | "registerPresets"
  | "registerEffects"
  | "registerPostProcessing"
  | "registerSfx"
  | "registerRenderPresets"
  | "registerTimelineItemTypes"
  | "registerImporters"
  | "registerExporters"
  | "registerTools";

export const KNOWN_PLUGIN_PERMISSIONS: PluginPermission[] = [
  "registerTemplates",
  "registerPresets",
  "registerEffects",
  "registerPostProcessing",
  "registerSfx",
  "registerRenderPresets",
  "registerTimelineItemTypes",
  "registerImporters",
  "registerExporters",
  "registerTools"
];
