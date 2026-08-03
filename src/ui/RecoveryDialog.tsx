import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import { useLocalization } from "../localization/LocalizationContext";
import type { LoadedProjectAutosave } from "../project/ProjectAutosave";

interface RecoveryDialogProps {
  candidate: LoadedProjectAutosave | null;
  error: string;
  onRestore: () => void;
  onDiscard: () => void;
}

export function RecoveryDialog({
  candidate,
  error,
  onRestore,
  onDiscard
}: RecoveryDialogProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  if (!candidate && !error) return null;

  const sourceLabel = candidate
    ? t(candidate.source === "primary" ? "recovery.source.primary" : "recovery.source.backup")
    : "";

  return (
    <div className="modal-backdrop recovery-backdrop" role="presentation">
      <section
        className="modal-panel recovery-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="recovery-title"
      >
        <div className="modal-header">
          <h2 id="recovery-title"><AlertTriangle size={18} />{t("recovery.title")}</h2>
        </div>
        {candidate ? (
          <>
            <p>{t("recovery.found", {
              source: sourceLabel,
              name: candidate.project.projectName
            })}</p>
            <p className="empty-note">{t("recovery.updated", {
              date: localization.formatDate(new Date(candidate.project.metadata.updatedAt), {
                dateStyle: "medium",
                timeStyle: "short"
              })
            })}</p>
            <div className="modal-actions">
              <button type="button" className="primary-action" autoFocus onClick={onRestore}>
                <RotateCcw size={14} />{t("recovery.restore")}
              </button>
              <button type="button" onClick={onDiscard}>
                <Trash2 size={14} />{t("recovery.discard")}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="error-note">{t("recovery.corrupt")}</p>
            <pre>{error}</pre>
            <button type="button" onClick={onDiscard}>{t("recovery.clear")}</button>
          </>
        )}
      </section>
    </div>
  );
}
