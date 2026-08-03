import type { AppSettings } from "../../settings/AppSettings";
import {
  updateWorkspacePanelCollapsed,
  type WorkspaceId,
  type WorkspaceLayoutSettings,
  type WorkspacePanelId
} from "../../settings/WorkspaceSettings";

export type WorkspaceLayoutPatch = Partial<Omit<WorkspaceLayoutSettings, "collapsedPanels">>;

export function updateWorkspaceLayout(
  settings: AppSettings,
  patch: WorkspaceLayoutPatch
): AppSettings {
  return {
    ...settings,
    editor: {
      ...settings.editor,
      workspace: {
        ...settings.editor.workspace,
        ...patch
      }
    }
  };
}

export function activateWorkspace(settings: AppSettings, workspace: WorkspaceId): AppSettings {
  return updateWorkspaceLayout(settings, { activeWorkspace: workspace });
}

export function setWorkspacePanelCollapsed(
  settings: AppSettings,
  panel: WorkspacePanelId,
  collapsed: boolean
): AppSettings {
  return {
    ...settings,
    editor: {
      ...settings.editor,
      workspace: updateWorkspacePanelCollapsed(settings.editor.workspace, panel, collapsed)
    }
  };
}
