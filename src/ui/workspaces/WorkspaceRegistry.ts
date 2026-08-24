import type { TranslationKey } from "../../localization/LocalizationTypes";
import type { WorkspaceId, WorkspacePanelId } from "../../settings/WorkspaceSettings";

/** Which animation editor a workspace opens with. */
export type WorkspaceTimelineView = "timeline" | "dopesheet" | "graph" | "nla";
/** Which properties category a workspace opens with. */
export type WorkspacePropertiesTab =
  | "render"
  | "world"
  | "object"
  | "rig"
  | "material";

export interface WorkspaceDefinition {
  id: WorkspaceId;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  visiblePanels: readonly WorkspacePanelId[];
  defaultQuality: "draft" | "final";
  /*
   * In Blender a workspace is a different ARRANGEMENT OF EDITORS, not just a
   * set of visibility toggles. Four of these workspaces previously listed the
   * same three panels, so switching between them changed nothing on screen.
   * These two fields give each one a distinct editor to open into.
   */
  timelineView: WorkspaceTimelineView;
  propertiesTab: WorkspacePropertiesTab;
}

export const WORKSPACE_DEFINITIONS: readonly WorkspaceDefinition[] = Object.freeze([
  {
    id: "layout",
    labelKey: "workspace.layout",
    descriptionKey: "workspace.layoutDescription",
    // Blender's Layout workspace is the 3D viewport plus the outliner and
    // properties column; the effects library lives in the VFX workspace so the
    // viewport keeps the width here.
    visiblePanels: ["outliner", "inspector", "timeline"],
    defaultQuality: "draft",
    timelineView: "timeline",
    propertiesTab: "object"
  },
  {
    id: "animation",
    labelKey: "workspace.animation",
    descriptionKey: "workspace.animationDescription",
    visiblePanels: ["outliner", "inspector", "timeline"],
    defaultQuality: "draft",
    timelineView: "dopesheet",
    propertiesTab: "rig"
  },
  {
    id: "cinematic",
    labelKey: "workspace.cinematic",
    descriptionKey: "workspace.cinematicDescription",
    visiblePanels: ["outliner", "inspector", "timeline"],
    defaultQuality: "final",
    timelineView: "nla",
    propertiesTab: "render"
  },
  {
    id: "vfx",
    labelKey: "workspace.vfx",
    descriptionKey: "workspace.vfxDescription",
    visiblePanels: ["effects", "inspector", "timeline"],
    defaultQuality: "draft",
    timelineView: "timeline",
    propertiesTab: "object"
  },
  {
    id: "lighting",
    labelKey: "workspace.lighting",
    descriptionKey: "workspace.lightingDescription",
    visiblePanels: ["outliner", "inspector", "timeline"],
    defaultQuality: "final",
    timelineView: "timeline",
    propertiesTab: "world"
  },
  {
    id: "export",
    labelKey: "workspace.export",
    descriptionKey: "workspace.exportDescription",
    visiblePanels: ["outliner", "inspector"],
    defaultQuality: "final",
    timelineView: "timeline",
    propertiesTab: "render"
  },
  {
    id: "debug",
    labelKey: "workspace.debug",
    descriptionKey: "workspace.debugDescription",
    visiblePanels: ["outliner", "effects", "inspector", "timeline"],
    defaultQuality: "draft",
    timelineView: "graph",
    propertiesTab: "object"
  }
]);

export function getWorkspaceDefinition(id: WorkspaceId): WorkspaceDefinition {
  return WORKSPACE_DEFINITIONS.find((workspace) => workspace.id === id) ?? WORKSPACE_DEFINITIONS[0];
}
