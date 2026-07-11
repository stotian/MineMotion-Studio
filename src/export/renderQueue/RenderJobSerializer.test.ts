import { describe, expect, it } from "vitest";
import { createInitialProject } from "../../project/ProjectStore";
import { createRenderJob } from "./RenderJob";
import { RenderJobSerializer } from "./RenderJobSerializer";

describe("RenderJobSerializer", () => {
  it("round-trips production render settings", () => {
    const project = createInitialProject();
    const job = createRenderJob(
      {
        ...project.exportSettings,
        format: "png_sequence",
        cameraId: "camera_main",
        includeAudio: false
      },
      { id: "render_serialized", now: "2026-01-01T00:00:00.000Z" }
    );

    const parsed = RenderJobSerializer.parse(RenderJobSerializer.serialize(job));

    expect(parsed.id).toBe(job.id);
    expect(parsed.settings.format).toBe("png_sequence");
    expect(parsed.settings.cameraId).toBe("camera_main");
    expect(parsed.status).toBe("queued");
  });

  it("recovers an interrupted running queue as queued", () => {
    const project = createInitialProject();
    const job = {
      ...createRenderJob(project.exportSettings, { id: "render_interrupted" }),
      status: "running" as const,
      progress: 0.4
    };

    const queue = RenderJobSerializer.parseQueue(
      JSON.stringify({ jobs: [job], activeJobId: job.id, historyLimit: 30 })
    );

    expect(queue.activeJobId).toBeNull();
    expect(queue.jobs[0].status).toBe("queued");
    expect(queue.jobs[0].message).toMatch(/recovered/i);
  });
});
