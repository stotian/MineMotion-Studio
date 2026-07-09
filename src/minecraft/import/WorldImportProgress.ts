export type WorldImportStatus =
  | "idle"
  | "scanning"
  | "reading-level"
  | "reading-regions"
  | "reading-chunks"
  | "meshing"
  | "complete"
  | "cancelled"
  | "error";

export interface WorldImportProgress {
  status: WorldImportStatus;
  current: number;
  total: number;
  message: string;
  error: string;
}

export const IDLE_WORLD_IMPORT_PROGRESS: WorldImportProgress = {
  status: "idle",
  current: 0,
  total: 0,
  message: "No world import running.",
  error: ""
};

export function createWorldImportProgress(
  patch: Partial<WorldImportProgress>
): WorldImportProgress {
  return {
    ...IDLE_WORLD_IMPORT_PROGRESS,
    ...patch
  };
}
