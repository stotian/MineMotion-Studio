import type { MineMotionProject } from "../project/ProjectFile";
import { sanitizeOutputName } from "./ExportSettings";
import type { ExportResult, ExportSettings } from "./ExportTypes";
import { captureViewportPng } from "./RenderCapture";

export async function exportCurrentFramePng(
  viewportShell: HTMLElement,
  project: MineMotionProject,
  settings: ExportSettings
): Promise<ExportResult> {
  const blob = await captureViewportPng(viewportShell, project, settings);
  return {
    blob,
    filename: `${sanitizeOutputName(settings.outputName)}_${String(project.animation.currentFrame).padStart(6, "0")}.png`,
    mimeType: "image/png",
    warnings: []
  };
}
