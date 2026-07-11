import { captureViewportPng } from "../../export/RenderCapture";
import type { ExportSettings } from "../../export/ExportTypes";
import type { MineMotionProject } from "../../project/ProjectFile";
import { createFinalCameraFrame } from "./FinalCameraRenderer";

export async function renderViewportFrameToPng(
  viewportShell: HTMLElement,
  project: MineMotionProject,
  settings: ExportSettings
): Promise<Blob> {
  const deterministicProject = createFinalCameraFrame(
    project,
    settings,
    project.animation.currentFrame
  );
  return await captureViewportPng(viewportShell, deterministicProject, settings);
}
