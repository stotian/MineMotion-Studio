import { describe, expect, it } from "vitest";
import { DEFAULT_APP_SETTINGS } from "../../settings/DefaultSettings";
import { sanitizeWorkspaceLayout } from "../../settings/WorkspaceSettings";
import { findShortcutConflicts } from "./ShortcutDiagnostics";
import { activateWorkspace, setWorkspacePanelCollapsed } from "./WorkspaceLayoutController";

const noop = () => undefined;

describe("premium workspace persistence", () => {
  it("bounds persisted sizes and repairs unknown workspaces", () => {
    expect(sanitizeWorkspaceLayout({
      activeWorkspace: "unknown",
      outlinerWidth: 9999,
      effectsWidth: 1,
      inspectorWidth: Number.NaN,
      timelineHeight: 700,
      collapsedPanels: ["outliner", "outliner", "unsafe"]
    })).toEqual({
      activeWorkspace: "layout",
      outlinerWidth: 520,
      effectsWidth: 200,
      inspectorWidth: 330,
      timelineHeight: 620,
      collapsedPanels: ["outliner"],
      density: "comfortable"
    });
  });

  it("switches workspace and preserves reversible panel collapse", () => {
    const animation = activateWorkspace(DEFAULT_APP_SETTINGS, "animation");
    const collapsed = setWorkspacePanelCollapsed(animation, "outliner", true);
    const restored = setWorkspacePanelCollapsed(collapsed, "outliner", false);
    expect(animation.editor.workspace.activeWorkspace).toBe("animation");
    expect(collapsed.editor.workspace.collapsedPanels).toEqual(["outliner"]);
    expect(restored.editor.workspace.collapsedPanels).toEqual([]);
  });

  it("reports duplicate shortcuts instead of silently binding both", () => {
    expect(findShortcutConflicts([
      { id: "save", title: "Save", group: "Project", shortcut: "Ctrl+S", run: noop },
      { id: "save-copy", title: "Save Copy", group: "Project", shortcut: "ctrl+s", run: noop },
      { id: "play", title: "Play", group: "Timeline", shortcut: "Space", run: noop }
    ])).toEqual([{ shortcut: "ctrl+s", commandIds: ["save", "save-copy"] }]);
  });
});
