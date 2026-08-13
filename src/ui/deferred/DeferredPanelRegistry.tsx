import { lazy } from "react";
import { createDeferredPanel } from "./DeferredPanel";
import type { AudioWorkspacePanelProps } from "../audio/AudioWorkspacePanel";
import type { AssetLibraryPanelProps } from "../assets/AssetLibraryPanel";
import type { SettingsModalProps } from "../settings/SettingsModal";
import type { TemplatePickerProps } from "../templates/TemplatePicker";
import type { PluginManagerPanelProps } from "../plugins/PluginManagerPanel";
import type { CommandPaletteProps } from "../../commands/CommandPalette";
import type { ExportPanelProps } from "../export/ExportPanel";
import type { RigStudioPanelProps } from "../rig/RigStudioPanel";
import type { LightingStudioPanelProps } from "../lighting/LightingStudioPanel";
import type { VfxWorkspacePanelProps } from "../vfx/VfxWorkspacePanel";
import type { ProductionWorkspacePanelProps } from "../production/ProductionWorkspacePanel";
import type { WorldImportPanelProps } from "../world/WorldImportPanel";
import type { HelpPanelProps } from "../help/HelpPanel";



export const AudioWorkspacePanel = createDeferredPanel<AudioWorkspacePanelProps>(() =>
  import("../audio/AudioWorkspacePanel").then((module) => ({
    default: module.AudioWorkspacePanel
  }))
);

export const AssetLibraryPanel = createDeferredPanel<AssetLibraryPanelProps>(() =>
  import("../assets/AssetLibraryPanel").then((module) => ({
    default: module.AssetLibraryPanel
  }))
);

export const SettingsModal = createDeferredPanel<SettingsModalProps>(() =>
  import("../settings/SettingsModal").then((module) => ({
    default: module.SettingsModal
  }))
);

export const TemplatePicker = createDeferredPanel<TemplatePickerProps>(() =>
  import("../templates/TemplatePicker").then((module) => ({
    default: module.TemplatePicker
  }))
);

export const PluginManagerPanel = createDeferredPanel<PluginManagerPanelProps>(() =>
  import("../plugins/PluginManagerPanel").then((module) => ({
    default: module.PluginManagerPanel
  }))
);

export const CommandPalette = createDeferredPanel<CommandPaletteProps>(() =>
  import("../../commands/CommandPalette").then((module) => ({
    default: module.CommandPalette
  }))
);

export const ExportPanel = createDeferredPanel<ExportPanelProps>(() =>
  import("../export/ExportPanel").then((module) => ({
    default: module.ExportPanel
  }))
);

export const RigStudioPanel = createDeferredPanel<RigStudioPanelProps>(() =>
  import("../rig/RigStudioPanel").then((module) => ({
    default: module.RigStudioPanel
  }))
);

export const LightingStudioPanel = createDeferredPanel<LightingStudioPanelProps>(() =>
  import("../lighting/LightingStudioPanel").then((module) => ({
    default: module.LightingStudioPanel
  }))
);

export const VfxWorkspacePanel = createDeferredPanel<VfxWorkspacePanelProps>(() =>
  import("../vfx/VfxWorkspacePanel").then((module) => ({
    default: module.VfxWorkspacePanel
  }))
);


export const ProductionWorkspacePanel = createDeferredPanel<ProductionWorkspacePanelProps>(() =>
  import("../production/ProductionWorkspacePanel").then((module) => ({
    default: module.ProductionWorkspacePanel
  }))
);

export const WorldImportPanel = createDeferredPanel<WorldImportPanelProps>(() =>
  import("../world/WorldImportPanel").then((module) => ({
    default: module.WorldImportPanel
  }))
);

export const HelpPanel = createDeferredPanel<HelpPanelProps>(() =>
  import("../help/HelpPanel").then((module) => ({
    default: module.HelpPanel
  }))
);


export const FirstLaunchExperience = lazy(() =>
  import("../onboarding/FirstLaunchExperience").then((module) => ({
    default: module.FirstLaunchExperience
  }))
);

export const DEFERRED_PANEL_IDS = Object.freeze([
  "audio",
  "assets",
  "settings",
  "templates",
  "plugins",
  "commands",
  "export",
  "rig-studio",
  "lighting-studio",
  "vfx-studio",
  "production",
  "world-import",
  "help",
  "first-launch"
] as const);
