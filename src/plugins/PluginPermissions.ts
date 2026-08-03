export type PluginPermission =
  | "registerCommands"
  | "registerTemplates"
  | "registerPresets"
  | "registerEffects"
  | "registerPostProcessing"
  | "registerSfx"
  | "registerRenderPresets"
  | "registerTimelineItemTypes"
  | "registerRigs"
  | "registerGenerators"
  | "registerImporters"
  | "registerExporters"
  | "registerLocalization"
  | "registerValidators"
  | "registerSettingsPages"
  | "registerTools";

export const KNOWN_PLUGIN_PERMISSIONS: PluginPermission[] = [
  "registerCommands",
  "registerTemplates",
  "registerPresets",
  "registerEffects",
  "registerPostProcessing",
  "registerSfx",
  "registerRenderPresets",
  "registerTimelineItemTypes",
  "registerRigs",
  "registerGenerators",
  "registerImporters",
  "registerExporters",
  "registerLocalization",
  "registerValidators",
  "registerSettingsPages",
  "registerTools"
];
