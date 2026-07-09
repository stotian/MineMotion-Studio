import { captureViewportPng } from "../../export/RenderCapture";
import type { ExportSettings } from "../../export/ExportTypes";
import type { MineMotionProject } from "../../project/ProjectFile";

export async function renderViewportFrameToPng(
  viewportShell: HTMLElement,
  project: MineMotionProject,
  settings: ExportSettings
): Promise<Blob> {
  return await captureViewportPng(viewportShell, project, settings);
}
