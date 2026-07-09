import type { ExportSettings } from "../../export/ExportTypes";

export interface RenderFrameContext {
  frame: number;
  frameIndex: number;
  totalFrames: number;
  timeSeconds: number;
}

export function createRenderFrameContexts(
  settings: ExportSettings
): RenderFrameContext[] {
  const totalFrames = settings.endFrame - settings.startFrame + 1;
  return Array.from({ length: totalFrames }, (_, index) => ({
    frame: settings.startFrame + index,
    frameIndex: index,
    totalFrames,
    timeSeconds: (settings.startFrame + index) / settings.fps
  }));
}
