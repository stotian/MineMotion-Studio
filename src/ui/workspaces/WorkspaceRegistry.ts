import type { TranslationKey } from "../../localization/LocalizationTypes";
import type { WorkspaceId, WorkspacePanelId } from "../../settings/WorkspaceSettings";

export interface WorkspaceDefinition {
  id: WorkspaceId;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  visiblePanels: readonly WorkspacePanelId[];
  defaultQuality: "draft" | "final";
}

export const WORKSPACE_DEFINITIONS: readonly WorkspaceDefinition[] = Object.freeze([
  {
    id: "layout",
    labelKey: "workspace.layout",
    descriptionKey: "workspace.layoutDescription",
    visiblePanels: ["outliner", "effects", "inspector", "timeline"],
    defaultQuality: "draft"
  },
  {
    id: "animation",
    labelKey: "workspace.animation",
    descriptionKey: "workspace.animationDescription",
    visiblePanels: ["outliner", "inspector", "timeline"],
    defaultQuality: "draft"
  },
  {
    id: "cinematic",
    labelKey: "workspace.cinematic",
    descriptionKey: "workspace.cinematicDescription",
    visiblePanels: ["outliner", "inspector", "timeline"],
    defaultQuality: "final"
  },
  {
    id: "vfx",
    labelKey: "workspace.vfx",
    descriptionKey: "workspace.vfxDescription",
    visiblePanels: ["effects", "inspector", "timeline"],
    defaultQuality: "draft"
  },
  {
    id: "lighting",
    labelKey: "workspace.lighting",
    descriptionKey: "workspace.lightingDescription",
    visiblePanels: ["outliner", "inspector", "timeline"],
    defaultQuality: "final"
  },
  {
    id: "export",
    labelKey: "workspace.export",
    descriptionKey: "workspace.exportDescription",
    visiblePanels: ["outliner", "inspector"],
    defaultQuality: "final"
  },
  {
    id: "debug",
    labelKey: "workspace.debug",
    descriptionKey: "workspace.debugDescription",
    visiblePanels: ["outliner", "effects", "inspector", "timeline"],
    defaultQuality: "draft"
  }
]);

export function getWorkspaceDefinition(id: WorkspaceId): WorkspaceDefinition {
  return WORKSPACE_DEFINITIONS.find((workspace) => workspace.id === id) ?? WORKSPACE_DEFINITIONS[0];
}
