import {
  createRenderId,
  type RenderJob,
  type RenderJobLogEntry,
  type RenderLogLevel,
  type RenderQueueState
} from "./RenderJob";

export function enqueueRenderJob(
  queue: RenderQueueState,
  job: RenderJob
): RenderQueueState {
  return trimHistory({ ...queue, jobs: [...queue.jobs, job] });
}

export function replaceRenderJob(
  queue: RenderQueueState,
  job: RenderJob
): RenderQueueState {
  return {
    ...queue,
    activeJobId: job.status === "running"
      ? job.id
      : queue.activeJobId === job.id
        ? null
        : queue.activeJobId,
    jobs: queue.jobs.map((item) => (item.id === job.id ? job : item))
  };
}

export function removeRenderJob(
  queue: RenderQueueState,
  jobId: string
): RenderQueueState {
  if (queue.activeJobId === jobId) return queue;
  return { ...queue, jobs: queue.jobs.filter((job) => job.id !== jobId) };
}

export function clearFinishedRenderJobs(queue: RenderQueueState): RenderQueueState {
  return {
    ...queue,
    jobs: queue.jobs.filter(
      (job) => job.status === "queued" || job.status === "running"
    )
  };
}

export function updateRenderJob(
  job: RenderJob,
  patch: Partial<RenderJob>,
  now = new Date().toISOString()
): RenderJob {
  return {
    ...job,
    ...patch,
    progress: clampProgress(patch.progress ?? job.progress),
    settings: patch.settings ? { ...patch.settings } : job.settings,
    updatedAt: now
  };
}

export function appendRenderLog(
  job: RenderJob,
  level: RenderLogLevel,
  message: string,
  now = new Date().toISOString()
): RenderJob {
  const entry: RenderJobLogEntry = {
    id: createRenderId("render_log"),
    level,
    message,
    createdAt: now
  };
  return updateRenderJob(job, { logs: [...job.logs, entry].slice(-200) }, now);
}

function trimHistory(queue: RenderQueueState): RenderQueueState {
  const limit = Math.max(1, queue.historyLimit);
  if (queue.jobs.length <= limit) return queue;
  const removable = queue.jobs.filter(
    (job) => job.status !== "queued" && job.status !== "running"
  );
  const removeCount = Math.min(queue.jobs.length - limit, removable.length);
  const removeIds = new Set(removable.slice(0, removeCount).map((job) => job.id));
  return { ...queue, jobs: queue.jobs.filter((job) => !removeIds.has(job.id)) };
}

function clampProgress(progress: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
}
