import type { MineMotionProject } from "../project/ProjectFile";
import type { ExportSettings, ExportValidationResult } from "./ExportTypes";
import {
  validateProductionExport,
  type ExportCapabilities
} from "./ExportValidation";

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  format: "png_frame",
  startFrame: 0,
  endFrame: 120,
  fps: 24,
  width: 1920,
  height: 1080,
  transparentBackground: false,
  includePostProcessing: true,
  includeVfx: true,
  includeCinematicBars: true,
  includeAudio: true,
  cameraId: "active",
  quality: "high",
  outputName: "render"
};

export function createDefaultExportSettings(
  project?: MineMotionProject
): ExportSettings {
  return {
    ...DEFAULT_EXPORT_SETTINGS,
    endFrame: project?.animation.durationFrames ?? DEFAULT_EXPORT_SETTINGS.endFrame,
    fps: project?.animation.fps ?? DEFAULT_EXPORT_SETTINGS.fps,
    width: project?.renderSettings.customWidth ?? DEFAULT_EXPORT_SETTINGS.width,
    height: project?.renderSettings.customHeight ?? DEFAULT_EXPORT_SETTINGS.height
  };
}

export function withExportSettingsDefaults(
  settings: Partial<ExportSettings> | undefined,
  project?: MineMotionProject
): ExportSettings {
  const defaults = createDefaultExportSettings(project);
  return {
    ...defaults,
    ...settings,
    startFrame: Math.max(0, Math.round(settings?.startFrame ?? defaults.startFrame)),
    endFrame: Math.max(0, Math.round(settings?.endFrame ?? defaults.endFrame)),
    fps: Math.max(1, Math.round(settings?.fps ?? defaults.fps)),
    width: Math.max(1, Math.round(settings?.width ?? defaults.width)),
    height: Math.max(1, Math.round(settings?.height ?? defaults.height)),
    outputName: sanitizeOutputName(settings?.outputName ?? defaults.outputName)
  };
}

export function validateExportSettings(
  settings: ExportSettings,
  project: MineMotionProject,
  capabilities: ExportCapabilities = {}
): ExportValidationResult {
  return validateProductionExport(settings, project, capabilities);
}

export function sanitizeOutputName(name: string): string {
  return (
    name
      .trim()
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "render"
  );
}
