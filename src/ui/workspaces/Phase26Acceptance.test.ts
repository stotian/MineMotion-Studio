import { describe, expect, it } from "vitest";
import { createDefaultProject } from "../../project/ProjectStore";
import { DEFAULT_APP_SETTINGS } from "../../settings/DefaultSettings";
import { SettingsSerializer } from "../../settings/SettingsSerializer";
import { WORKSPACE_DEFINITIONS } from "./WorkspaceRegistry";
import { collectOutlinerWarnings } from "../outliner/OutlinerViewModel";
import { validateInspectorSchema } from "../inspector/InspectorSchema";

describe("phase 26 acceptance", () => {
  it("ships every required stable workspace with a recoverable layout", () => {
    expect(WORKSPACE_DEFINITIONS.map((workspace) => workspace.id)).toEqual([
      "layout", "animation", "cinematic", "vfx", "lighting", "export", "debug"
    ]);
    const restored = SettingsSerializer.parse(SettingsSerializer.serialize({
      ...DEFAULT_APP_SETTINGS,
      editor: {
        ...DEFAULT_APP_SETTINGS.editor,
        workspace: { ...DEFAULT_APP_SETTINGS.editor.workspace, activeWorkspace: "cinematic", outlinerWidth: 312 }
      }
    }));
    expect(restored.editor.workspace.activeWorkspace).toBe("cinematic");
    expect(restored.editor.workspace.outlinerWidth).toBe(312);
  });

  it("keeps context models valid on a clean project", () => {
    expect(validateInspectorSchema()).toEqual([]);
    expect(collectOutlinerWarnings(createDefaultProject())).toEqual([]);
  });
});
