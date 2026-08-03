export const WORKSPACE_IDS = [
  "layout",
  "animation",
  "cinematic",
  "vfx",
  "lighting",
  "export",
  "debug"
] as const;

export type WorkspaceId = (typeof WORKSPACE_IDS)[number];

export const WORKSPACE_PANEL_IDS = [
  "outliner",
  "effects",
  "inspector",
  "timeline"
] as const;

export type WorkspacePanelId = (typeof WORKSPACE_PANEL_IDS)[number];

export interface WorkspaceLayoutSettings {
  activeWorkspace: WorkspaceId;
  outlinerWidth: number;
  effectsWidth: number;
  inspectorWidth: number;
  timelineHeight: number;
  collapsedPanels: WorkspacePanelId[];
  density: "comfortable" | "compact";
}

export const DEFAULT_WORKSPACE_LAYOUT: WorkspaceLayoutSettings = Object.freeze({
  activeWorkspace: "layout",
  outlinerWidth: 250,
  effectsWidth: 280,
  inspectorWidth: 330,
  timelineHeight: 310,
  collapsedPanels: [],
  density: "comfortable"
});

function clampNumber(value: unknown, fallback: number, minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.round(Math.min(maximum, Math.max(minimum, value)));
}

export function sanitizeWorkspaceLayout(value: unknown): WorkspaceLayoutSettings {
  const source = value && typeof value === "object"
    ? value as Partial<WorkspaceLayoutSettings>
    : {};
  const activeWorkspace = WORKSPACE_IDS.includes(source.activeWorkspace as WorkspaceId)
    ? source.activeWorkspace as WorkspaceId
    : DEFAULT_WORKSPACE_LAYOUT.activeWorkspace;
  const collapsedPanels = Array.isArray(source.collapsedPanels)
    ? source.collapsedPanels.filter(
        (panel, index, values): panel is WorkspacePanelId =>
          WORKSPACE_PANEL_IDS.includes(panel as WorkspacePanelId) && values.indexOf(panel) === index
      )
    : [];
  return {
    activeWorkspace,
    outlinerWidth: clampNumber(source.outlinerWidth, DEFAULT_WORKSPACE_LAYOUT.outlinerWidth, 180, 520),
    effectsWidth: clampNumber(source.effectsWidth, DEFAULT_WORKSPACE_LAYOUT.effectsWidth, 200, 560),
    inspectorWidth: clampNumber(source.inspectorWidth, DEFAULT_WORKSPACE_LAYOUT.inspectorWidth, 240, 620),
    timelineHeight: clampNumber(source.timelineHeight, DEFAULT_WORKSPACE_LAYOUT.timelineHeight, 180, 620),
    collapsedPanels,
    density: source.density === "compact" ? "compact" : "comfortable"
  };
}

export function updateWorkspacePanelCollapsed(
  layout: WorkspaceLayoutSettings,
  panel: WorkspacePanelId,
  collapsed: boolean
): WorkspaceLayoutSettings {
  const collapsedPanels = collapsed
    ? [...new Set([...layout.collapsedPanels, panel])]
    : layout.collapsedPanels.filter((candidate) => candidate !== panel);
  return { ...layout, collapsedPanels };
}
