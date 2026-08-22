import type { AppSettings } from "./SettingsTypes";
import { DEFAULT_WORKSPACE_LAYOUT } from "./WorkspaceSettings";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  schemaVersion: 2,
  general: {
    language: "en",
    autosaveEnabled: true,
    autosaveIntervalSeconds: 30,
    defaultProjectDurationFrames: 300,
    defaultFps: 24,
    defaultProjectNamePattern: "Untitled MineMotion Project",
    recentProjects: []
  },
  viewport: {
    backgroundColor: "#87bfff",
    gridEnabled: true,
    gridSize: 64,
    cameraSensitivity: 1,
    orbitSpeed: 1,
    panSpeed: 1,
    zoomSpeed: 1,
    showWorldOrigin: true,
    showCameraObjects: true,
    showRigBones: true,
    showLightHelpers: true,
    renderQuality: "high"
  },
  editor: {
    theme: "dark",
    uiScale: 1,
    textScale: 1,
    reducedMotion: false,
    highContrast: false,
    colorVisionMode: "normal",
    snapToGrid: false,
    transformStep: 0.1,
    rotationStepDegrees: 5,
    defaultInterpolationMode: "linear",
    workspace: { ...DEFAULT_WORKSPACE_LAYOUT, collapsedPanels: [] }
  },
  minecraft: {
    defaultSkyPreset: "Day",
    defaultBlockPaletteStyle: "classic",
    defaultTerrainSize: 18,
    resourcePackPath: ""
  },
  plugins: {
    pluginsEnabled: true,
    pluginFolderPath: "",
    allowExperimentalPlugins: false,
    pluginWarningAccepted: false,
    disabledPluginIds: [],
    safeMode: false
  }
};
