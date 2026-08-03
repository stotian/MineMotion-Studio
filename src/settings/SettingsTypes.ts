import type { SkyPresetId } from "../renderer/SkyTypes";
import type { AppLanguagePreference } from "../localization/LocalizationTypes";
import type { WorkspaceLayoutSettings } from "./WorkspaceSettings";

export type ThemeId = "dark" | "light";
export type RenderQuality = "low" | "medium" | "high";
export type InterpolationMode = "linear" | "step";
export type BlockPaletteStyle = "classic" | "muted" | "nether";
export type ColorVisionMode = "normal" | "protanopia" | "deuteranopia" | "tritanopia";

export interface RecentProjectEntry {
  id: string;
  name: string;
  savedAt: string;
  storageHint: "download" | "autosave" | "browser" | "native";
}

export interface GeneralSettings {
  language: AppLanguagePreference;
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
  textScale: number;
  reducedMotion: boolean;
  highContrast: boolean;
  colorVisionMode: ColorVisionMode;
  snapToGrid: boolean;
  transformStep: number;
  rotationStepDegrees: number;
  defaultInterpolationMode: InterpolationMode;
  workspace: WorkspaceLayoutSettings;
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
  safeMode: boolean;
}

export interface AppSettings {
  schemaVersion: 2;
  general: GeneralSettings;
  viewport: ViewportSettings;
  editor: EditorSettings;
  minecraft: MinecraftSettings;
  plugins: PluginSettings;
}
