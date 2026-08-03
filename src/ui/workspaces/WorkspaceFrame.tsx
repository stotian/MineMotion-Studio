import { Children, useCallback } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocalization } from "../../localization/LocalizationContext";
import type {
  WorkspaceLayoutSettings,
  WorkspacePanelId
} from "../../settings/WorkspaceSettings";
import { getWorkspaceDefinition } from "./WorkspaceRegistry";

interface WorkspaceFrameProps {
  layout: WorkspaceLayoutSettings;
  onLayoutChange: (patch: Partial<WorkspaceLayoutSettings>) => void;
  onPanelCollapsedChange: (panel: WorkspacePanelId, collapsed: boolean) => void;
  children: ReactNode;
}

type WidthKey = "outlinerWidth" | "effectsWidth" | "inspectorWidth";

const LIMITS: Readonly<Record<WidthKey, readonly [number, number]>> = {
  outlinerWidth: [180, 520],
  effectsWidth: [200, 560],
  inspectorWidth: [240, 620]
};

export function WorkspaceFrame({
  layout,
  onLayoutChange,
  onPanelCollapsedChange,
  children
}: WorkspaceFrameProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const slots = Children.toArray(children);
  if (slots.length !== 4) {
    throw new Error(`WorkspaceFrame requires exactly four panel slots; received ${slots.length}.`);
  }
  const definition = getWorkspaceDefinition(layout.activeWorkspace);
  const isVisible = (panel: WorkspacePanelId) =>
    definition.visiblePanels.includes(panel) && !layout.collapsedPanels.includes(panel);
  const style = {
    "--workspace-outliner-width": isVisible("outliner") ? `${layout.outlinerWidth}px` : "0px",
    "--workspace-effects-width": isVisible("effects") ? `${layout.effectsWidth}px` : "0px",
    "--workspace-inspector-width": isVisible("inspector") ? `${layout.inspectorWidth}px` : "0px"
  } as CSSProperties;

  const beginResize = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    key: WidthKey,
    direction: 1 | -1
  ) => {
    event.preventDefault();
    const startX = event.clientX;
    const startValue = layout[key];
    const [minimum, maximum] = LIMITS[key];
    const move = (moveEvent: PointerEvent) => {
      const next = Math.min(maximum, Math.max(minimum, startValue + (moveEvent.clientX - startX) * direction));
      onLayoutChange({ [key]: Math.round(next) });
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  }, [layout, onLayoutChange]);

  return (
    <section
      className={`workspace workspace-${layout.activeWorkspace} workspace-density-${layout.density}`}
      data-workspace={layout.activeWorkspace}
      style={style}
      aria-label={t("workspace.editorAria", { workspace: t(definition.labelKey) })}
    >
      <WorkspaceSlot visible={isVisible("outliner")} panel="outliner" onCollapse={onPanelCollapsedChange}>
        {slots[0]}
      </WorkspaceSlot>
      <PanelResizer panel="outliner" visible={isVisible("outliner")} label={t("workspace.resizeOutliner")} onPointerDown={(event) => beginResize(event, "outlinerWidth", 1)} />
      <WorkspaceSlot visible={isVisible("effects")} panel="effects" onCollapse={onPanelCollapsedChange}>
        {slots[1]}
      </WorkspaceSlot>
      <PanelResizer panel="effects" visible={isVisible("effects")} label={t("workspace.resizeEffects")} onPointerDown={(event) => beginResize(event, "effectsWidth", 1)} />
      <div className="workspace-viewport-slot">{slots[2]}</div>
      <PanelResizer panel="inspector" visible={isVisible("inspector")} label={t("workspace.resizeInspector")} onPointerDown={(event) => beginResize(event, "inspectorWidth", -1)} />
      <WorkspaceSlot visible={isVisible("inspector")} panel="inspector" onCollapse={onPanelCollapsedChange}>
        {slots[3]}
      </WorkspaceSlot>
      <CollapsedPanelRail
        layout={layout}
        visiblePanels={definition.visiblePanels}
        onExpand={(panel) => onPanelCollapsedChange(panel, false)}
      />
    </section>
  );
}

function WorkspaceSlot({
  visible,
  panel,
  onCollapse,
  children
}: {
  visible: boolean;
  panel: WorkspacePanelId;
  onCollapse: (panel: WorkspacePanelId, collapsed: boolean) => void;
  children: ReactNode;
}) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  return (
    <div className={`workspace-panel-slot workspace-panel-${panel}`} hidden={!visible}>
      {children}
      <button
        type="button"
        className="workspace-collapse-button"
        aria-label={t("workspace.collapsePanel")}
        title={t("workspace.collapsePanel")}
        onClick={() => onCollapse(panel, true)}
      >
        {panel === "inspector" ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );
}

function PanelResizer({
  panel,
  visible,
  label,
  onPointerDown
}: {
  panel: "outliner" | "effects" | "inspector";
  visible: boolean;
  label: string;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      hidden={!visible}
      className={`workspace-resizer workspace-resizer-${panel}`}
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      tabIndex={0}
      onPointerDown={onPointerDown}
    />
  );
}

function CollapsedPanelRail({
  layout,
  visiblePanels,
  onExpand
}: {
  layout: WorkspaceLayoutSettings;
  visiblePanels: readonly WorkspacePanelId[];
  onExpand: (panel: WorkspacePanelId) => void;
}) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const panels = layout.collapsedPanels.filter((panel) => visiblePanels.includes(panel));
  if (panels.length === 0) return null;
  return (
    <div className="workspace-collapsed-rail" aria-label={t("workspace.collapsedPanels")}>
      {panels.map((panel) => (
        <button key={panel} type="button" onClick={() => onExpand(panel)}>
          {t(`workspace.panel.${panel}`)}
        </button>
      ))}
    </div>
  );
}
