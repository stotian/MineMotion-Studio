import type { SkyPresetId } from "../renderer/SkySystem";

export type ThemeId = "dark" | "light";
export type RenderQuality = "low" | "medium" | "high";
export type InterpolationMode = "linear" | "step";
export type BlockPaletteStyle = "classic" | "muted" | "nether";

export interface RecentProjectEntry {
  id: string;
  name: string;
  savedAt: string;
  storageHint: "download" | "autosave" | "browser";
}

export interface GeneralSettings {
  autosaveEnabled: boolean;
  autosaveIntervalSeconds: number;
  defaultProjectDurationFrames: number;
  defaultFps: number;
  defaultProjectNamePattern: string;
  recentProjects: RecentProjectEntry[];
}

export interface ViewportSettings {
  backgroundColor: string;
  gridEnabled: boolean;
  gridSize: number;
  cameraSensitivity: number;
  orbitSpeed: number;
  panSpeed: number;
  zoomSpeed: number;
  showWorldOrigin: boolean;
  showCameraObjects: boolean;
  showRigBones: boolean;
  showLightHelpers: boolean;
  renderQuality: RenderQuality;
}

export interface EditorSettings {
  theme: ThemeId;
  uiScale: number;
  snapToGrid: boolean;
  transformStep: number;
  rotationStepDegrees: number;
  defaultInterpolationMode: InterpolationMode;
}

export interface MinecraftSettings {
  defaultSkyPreset: SkyPresetId;
  defaultBlockPaletteStyle: BlockPaletteStyle;
  defaultTerrainSize: number;
  resourcePackPath: string;
}

export interface PluginSettings {
  pluginsEnabled: boolean;
  pluginFolderPath: string;
  allowExperimentalPlugins: boolean;
  pluginWarningAccepted: boolean;
  disabledPluginIds: string[];
}

export interface AppSettings {
  schemaVersion: 1;
  general: GeneralSettings;
  viewport: ViewportSettings;
  editor: EditorSettings;
  minecraft: MinecraftSettings;
  plugins: PluginSettings;
}

