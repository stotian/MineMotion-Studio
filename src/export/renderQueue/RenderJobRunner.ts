import { appendRenderLog, updateRenderJob } from "./RenderQueue";
import type { RenderJob } from "./RenderJob";

export interface RenderJobRunContext {
  isCancelled: () => boolean;
  throwIfCancelled: () => void;
  report: (progress: number, message: string) => void;
  log: (message: string) => void;
}

export interface RenderJobRunResult {
  message: string;
  outputPath?: string;
}

export class RenderJobCancelledError extends Error {
  constructor() {
    super("Render job cancelled.");
    this.name = "RenderJobCancelledError";
  }
}

export class RenderJobRunner {
  private cancelled = false;

  cancel(): void {
    this.cancelled = true;
  }

  async run(
    job: RenderJob,
    handler: (context: RenderJobRunContext) => Promise<RenderJobRunResult>,
    onUpdate: (job: RenderJob) => void
  ): Promise<RenderJob> {
    this.cancelled = false;
    let current = appendRenderLog(
      updateRenderJob(job, {
        status: "running",
        progress: 0,
        message: "Preparing render job.",
        error: ""
      }),
      "info",
      "Render job started."
    );
    onUpdate(current);

    const update = (progress: number, message: string) => {
      current = updateRenderJob(current, { progress, message });
      onUpdate(current);
    };
    const log = (message: string) => {
      current = appendRenderLog(current, "info", message);
      onUpdate(current);
    };

    try {
      const result = await handler({
        isCancelled: () => this.cancelled,
        throwIfCancelled: () => {
          if (this.cancelled) throw new RenderJobCancelledError();
        },
        report: update,
        log
      });
      current = appendRenderLog(
        updateRenderJob(current, {
          status: "complete",
          progress: 1,
          message: result.message,
          outputPath: result.outputPath ?? ""
        }),
        "info",
        result.message
      );
    } catch (error) {
      if (error instanceof RenderJobCancelledError || this.cancelled) {
        current = appendRenderLog(
          updateRenderJob(current, {
            status: "cancelled",
            message: "Render job cancelled.",
            error: ""
          }),
          "warning",
          "Render job cancelled by user."
        );
      } else {
        const message = error instanceof Error ? error.message : "Render job failed.";
        current = appendRenderLog(
          updateRenderJob(current, {
            status: "error",
            message,
            error: message
          }),
          "error",
          message
        );
      }
    }
    onUpdate(current);
    return current;
  }
}
