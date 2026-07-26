import { createDeferredPanel } from "./DeferredPanel";

export const SettingsModal = createDeferredPanel(() =>
  import("../settings/SettingsModal").then((module) => ({
    default: module.SettingsModal
  }))
);

export const TemplatePicker = createDeferredPanel(() =>
  import("../templates/TemplatePicker").then((module) => ({
    default: module.TemplatePicker
  }))
);

export const PluginManagerPanel = createDeferredPanel(() =>
  import("../plugins/PluginManagerPanel").then((module) => ({
    default: module.PluginManagerPanel
  }))
);

export const CommandPalette = createDeferredPanel(() =>
  import("../../commands/CommandPalette").then((module) => ({
    default: module.CommandPalette
  }))
);

export const ExportPanel = createDeferredPanel(() =>
  import("../export/ExportPanel").then((module) => ({
    default: module.ExportPanel
  }))
);

export const RigStudioPanel = createDeferredPanel(() =>
  import("../rig/RigStudioPanel").then((module) => ({
    default: module.RigStudioPanel
  }))
);

export const LightingStudioPanel = createDeferredPanel(() =>
  import("../lighting/LightingStudioPanel").then((module) => ({
    default: module.LightingStudioPanel
  }))
);

export const VfxWorkspacePanel = createDeferredPanel(() =>
  import("../vfx/VfxWorkspacePanel").then((module) => ({
    default: module.VfxWorkspacePanel
  }))
);

export const WorldImportPanel = createDeferredPanel(() =>
  import("../world/WorldImportPanel").then((module) => ({
    default: module.WorldImportPanel
  }))
);

export const HelpPanel = createDeferredPanel(() =>
  import("../help/HelpPanel").then((module) => ({
    default: module.HelpPanel
  }))
);

export const DEFERRED_PANEL_IDS = Object.freeze([
  "settings",
  "templates",
  "plugins",
  "commands",
  "export",
  "rig-studio",
  "lighting-studio",
  "vfx-studio",
  "world-import",
  "help"
] as const);
