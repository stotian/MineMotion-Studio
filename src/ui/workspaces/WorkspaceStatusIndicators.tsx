import { Activity, CheckCircle2, CloudOff, Save, TriangleAlert } from "lucide-react";
import { useLocalization } from "../../localization/LocalizationContext";

export function WorkspaceStatusIndicators({
  dirty,
  autosaveEnabled,
  exporting,
  capabilityWarnings
}: {
  dirty: boolean;
  autosaveEnabled: boolean;
  exporting: boolean;
  capabilityWarnings: number;
}) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  return (
    <div className="workspace-status-indicators" aria-label={t("workspace.statusIndicators")}>
      <span title={dirty ? t("status.unsaved") : t("status.saved")}>
        {dirty ? <Save size={15} /> : <CheckCircle2 size={15} />}
      </span>
      <span title={autosaveEnabled ? t("workspace.autosaveEnabled") : t("workspace.autosaveDisabled")}>
        {autosaveEnabled ? <Activity size={15} /> : <CloudOff size={15} />}
      </span>
      {exporting && <span title={t("workspace.renderInProgress")}><Activity size={15} className="indicator-pulse" /></span>}
      {capabilityWarnings > 0 && (
        <span title={t("workspace.capabilityWarnings", { count: capabilityWarnings })}>
          <TriangleAlert size={15} />
          <small>{capabilityWarnings}</small>
        </span>
      )}
    </div>
  );
}
