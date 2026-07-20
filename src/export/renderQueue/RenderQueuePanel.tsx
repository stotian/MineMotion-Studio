import { Play, Trash2, X } from "lucide-react";
import { formatLabel } from "../ExportValidation";
import type { RenderQueueState } from "./RenderJob";
import { useLocalization } from "../../localization/LocalizationContext";

export function RenderQueuePanel({
  queue,
  onRun,
  onRemove,
  onClearFinished
}: {
  queue: RenderQueueState;
  onRun: (jobId: string) => void;
  onRemove: (jobId: string) => void;
  onClearFinished: () => void;
}) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  return (
    <div className="render-queue">
      <div className="render-queue-header">
        <strong>{localization.plural({ one: "queue.jobs.one", other: "queue.jobs.other" }, queue.jobs.length)}</strong>
        <button type="button" onClick={onClearFinished} disabled={queue.jobs.length === 0}>
          <Trash2 size={14} />
          {t("queue.clearFinished")}
        </button>
      </div>
      {queue.jobs.length === 0 ? (
        <p className="empty-note">{t("queue.empty")}</p>
      ) : (
        <div className="render-job-list">
          {queue.jobs.map((job) => {
            const running = queue.activeJobId === job.id || job.status === "running";
            return (
              <article className={`render-job render-job-${job.status}`} key={job.id}>
                <div>
                  <strong>{job.name}</strong>
                  <span>
                    {formatLabel(job.settings.format)} | {job.settings.width}x{job.settings.height} | {job.settings.fps} FPS
                  </span>
                </div>
                <div className="render-job-actions">
                  <button
                    type="button"
                    title={t("queue.run")}
                    disabled={running || queue.activeJobId !== null}
                    onClick={() => onRun(job.id)}
                  >
                    <Play size={14} />
                  </button>
                  <button
                    type="button"
                    title={t("queue.remove")}
                    disabled={running}
                    onClick={() => onRemove(job.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
                <progress value={job.progress} max={1} />
                <small>{job.status}: {job.message}</small>
                {job.outputPath && <small title={job.outputPath}>{job.outputPath}</small>}
                {job.error && <small className="render-job-error">{job.error}</small>}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
