import type { AppSettings } from "./SettingsTypes";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  schemaVersion: 1,
  general: {
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
    snapToGrid: false,
    transformStep: 0.1,
    rotationStepDegrees: 5,
    defaultInterpolationMode: "linear"
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
    disabledPluginIds: []
  }
};

