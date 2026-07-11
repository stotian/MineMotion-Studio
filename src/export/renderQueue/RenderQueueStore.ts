import { withExportSettingsDefaults } from "../ExportSettings";
import type { RenderJob, RenderJobStatus, RenderQueueState } from "./RenderJob";

export const DEFAULT_RENDER_QUEUE: RenderQueueState = {
  jobs: [],
  activeJobId: null,
  historyLimit: 30
};

const STATUSES = new Set<RenderJobStatus>([
  "queued",
  "running",
  "complete",
  "cancelled",
  "error"
]);

export function sanitizeRenderQueue(value: unknown): RenderQueueState {
  if (!value || typeof value !== "object") return { ...DEFAULT_RENDER_QUEUE };
  const source = value as Partial<RenderQueueState>;
  const jobs = Array.isArray(source.jobs)
    ? source.jobs.flatMap((job, index) => sanitizeJob(job, index))
    : [];
  return {
    jobs: jobs.map((job) =>
      job.status === "running"
        ? {
            ...job,
            status: "queued",
            message: "Recovered after application restart."
          }
        : job
    ),
    activeJobId: null,
    historyLimit: Math.min(200, Math.max(1, Math.round(Number(source.historyLimit) || 30)))
  };
}

function sanitizeJob(value: unknown, index: number): RenderJob[] {
  if (!value || typeof value !== "object") return [];
  const source = value as Partial<RenderJob>;
  if (!source.settings || typeof source.settings !== "object") return [];
  const now = new Date().toISOString();
  const status = STATUSES.has(source.status as RenderJobStatus)
    ? (source.status as RenderJobStatus)
    : "queued";
  return [{
    id: typeof source.id === "string" && source.id ? source.id : `render_recovered_${index}`,
    name: typeof source.name === "string" && source.name.trim() ? source.name : "Recovered render",
    settings: withExportSettingsDefaults(source.settings),
    status,
    progress: Math.min(1, Math.max(0, Number(source.progress) || 0)),
    message: typeof source.message === "string" ? source.message : "",
    error: typeof source.error === "string" ? source.error : "",
    outputPath: typeof source.outputPath === "string" ? source.outputPath : "",
    logs: Array.isArray(source.logs)
      ? source.logs.flatMap((entry, logIndex) => {
          if (!entry || typeof entry !== "object") return [];
          const log = entry as RenderJob["logs"][number];
          return [{
            id: typeof log.id === "string" ? log.id : `render_log_${logIndex}`,
            level: log.level === "warning" || log.level === "error" ? log.level : "info",
            message: typeof log.message === "string" ? log.message : "",
            createdAt: typeof log.createdAt === "string" ? log.createdAt : now
          }];
        })
      : [],
    createdAt: typeof source.createdAt === "string" ? source.createdAt : now,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : now
  }];
}
