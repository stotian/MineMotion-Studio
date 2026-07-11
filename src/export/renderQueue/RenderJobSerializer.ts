import type { RenderJob, RenderQueueState } from "./RenderJob";
import { sanitizeRenderQueue } from "./RenderQueueStore";

export class RenderJobSerializer {
  static serialize(job: RenderJob): string {
    return JSON.stringify(job, null, 2);
  }

  static parse(raw: string): RenderJob {
    const parsed = JSON.parse(raw) as unknown;
    const queue = sanitizeRenderQueue({ jobs: [parsed], activeJobId: null, historyLimit: 30 });
    if (queue.jobs.length !== 1) throw new Error("Invalid render job data.");
    return queue.jobs[0];
  }

  static serializeQueue(queue: RenderQueueState): string {
    return JSON.stringify(queue, null, 2);
  }

  static parseQueue(raw: string): RenderQueueState {
    return sanitizeRenderQueue(JSON.parse(raw) as unknown);
  }
}
