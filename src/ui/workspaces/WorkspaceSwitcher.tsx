import { LayoutDashboard } from "lucide-react";
import { useLocalization } from "../../localization/LocalizationContext";
import type { WorkspaceId } from "../../settings/WorkspaceSettings";
import { WORKSPACE_DEFINITIONS } from "./WorkspaceRegistry";

export function WorkspaceSwitcher({
  value,
  onChange
}: {
  value: WorkspaceId;
  onChange: (workspace: WorkspaceId) => void;
}) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  return (
    <label className="workspace-switcher" title={t("workspace.switcherHelp")}>
      <LayoutDashboard size={16} aria-hidden="true" />
      <span className="sr-only">{t("workspace.switcher")}</span>
      <select
        value={value}
        aria-label={t("workspace.switcher")}
        onChange={(event) => onChange(event.target.value as WorkspaceId)}
      >
        {WORKSPACE_DEFINITIONS.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {t(workspace.labelKey)}
          </option>
        ))}
      </select>
    </label>
  );
}
