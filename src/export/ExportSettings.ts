import type { MineMotionProject } from "../project/ProjectFile";
import type { ExportSettings, ExportValidationResult } from "./ExportTypes";

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
  project: MineMotionProject
): ExportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (settings.startFrame > settings.endFrame) {
    errors.push("Start frame must be before or equal to end frame.");
  }
  if (settings.endFrame > project.animation.durationFrames) {
    warnings.push("End frame is beyond the project duration and will render empty hold frames.");
  }
  if (settings.width * settings.height > 3840 * 2160) {
    warnings.push("Resolution is above 4K and may be slow in browser export.");
  }
  if (settings.format === "mp4_video") {
    errors.push("MP4 export requires the future FFmpeg/native pipeline.");
  }
  if (settings.cameraId === "active" && !project.activeCameraId) {
    errors.push("No active camera is set.");
  }
  if (!settings.outputName) {
    errors.push("Output name is required.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
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
