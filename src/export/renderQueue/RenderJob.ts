import type { ExportSettings } from "../ExportTypes";
import { createId } from "../../core/ids/Id";

export type RenderJobStatus =
  | "queued"
  | "running"
  | "complete"
  | "cancelled"
  | "error";

export type RenderLogLevel = "info" | "warning" | "error";

export interface RenderJobLogEntry {
  id: string;
  level: RenderLogLevel;
  message: string;
  createdAt: string;
}

export interface RenderJob {
  id: string;
  name: string;
  settings: ExportSettings;
  status: RenderJobStatus;
  progress: number;
  message: string;
  error: string;
  outputPath: string;
  logs: RenderJobLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface RenderQueueState {
  jobs: RenderJob[];
  activeJobId: string | null;
  historyLimit: number;
}

export function createRenderJob(
  settings: ExportSettings,
  options: { id?: string; now?: string; name?: string } = {}
): RenderJob {
  const now = options.now ?? new Date().toISOString();
  return {
    id: options.id ?? createRenderId("render"),
    name: options.name?.trim() || settings.outputName || "Render",
    settings: { ...settings },
    status: "queued",
    progress: 0,
    message: "Waiting in render queue.",
    error: "",
    outputPath: "",
    logs: [],
    createdAt: now,
    updatedAt: now
  };
}

export function createRenderId(prefix: string): string {
  return createId(prefix);
}
