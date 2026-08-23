import { useLocalization } from "../../localization/LocalizationContext";
import type { WorkspaceId } from "../../settings/WorkspaceSettings";
import { WORKSPACE_DEFINITIONS } from "./WorkspaceRegistry";

/**
 * Blender exposes its workspaces as a row of tabs across the top bar rather
 * than a dropdown, so the whole set is visible and one click away.
 */
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
    <nav
      className="workspace-switcher"
      role="tablist"
      aria-label={t("workspace.switcher")}
      title={t("workspace.switcherHelp")}
    >
      {WORKSPACE_DEFINITIONS.map((workspace) => (
        <button
          key={workspace.id}
          type="button"
          role="tab"
          aria-selected={value === workspace.id}
          className={value === workspace.id ? "is-active" : undefined}
          onClick={() => onChange(workspace.id)}
        >
          {t(workspace.labelKey)}
        </button>
      ))}
    </nav>
  );
}
