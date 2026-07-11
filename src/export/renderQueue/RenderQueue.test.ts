import { describe, expect, it } from "vitest";
import { createInitialProject } from "../../project/ProjectStore";
import { createRenderJob } from "./RenderJob";
import {
  clearFinishedRenderJobs,
  enqueueRenderJob,
  removeRenderJob,
  replaceRenderJob,
  updateRenderJob
} from "./RenderQueue";
import { DEFAULT_RENDER_QUEUE } from "./RenderQueueStore";

describe("render queue", () => {
  it("enqueues, runs and clears completed jobs", () => {
    const project = createInitialProject();
    const job = createRenderJob(project.exportSettings, {
      id: "render_test",
      now: "2026-01-01T00:00:00.000Z"
    });
    const queued = enqueueRenderJob(DEFAULT_RENDER_QUEUE, job);
    const runningJob = updateRenderJob(job, { status: "running", progress: 0.5 });
    const running = replaceRenderJob(queued, runningJob);
    const complete = replaceRenderJob(
      running,
      updateRenderJob(runningJob, { status: "complete", progress: 1 })
    );

    expect(running.activeJobId).toBe(job.id);
    expect(complete.activeJobId).toBeNull();
    expect(clearFinishedRenderJobs(complete).jobs).toEqual([]);
  });

  it("does not remove the active job", () => {
    const project = createInitialProject();
    const job = updateRenderJob(
      createRenderJob(project.exportSettings, { id: "render_active" }),
      { status: "running" }
    );
    const queue = { ...DEFAULT_RENDER_QUEUE, jobs: [job], activeJobId: job.id };

    expect(removeRenderJob(queue, job.id)).toEqual(queue);
  });
});
