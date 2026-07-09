import type { ExportProgressState } from "./ExportTypes";

export const IDLE_EXPORT_PROGRESS: ExportProgressState = {
  status: "idle",
  currentFrame: 0,
  totalFrames: 0,
  message: "No export running.",
  error: ""
};

export function createExportProgress(
  patch: Partial<ExportProgressState>
): ExportProgressState {
  return {
    ...IDLE_EXPORT_PROGRESS,
    ...patch
  };
}
