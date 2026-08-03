import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Box,
  Camera,
  ChevronDown,
  ChevronRight,
  Cuboid,
  Eye,
  EyeOff,
  GitBranch,
  Lightbulb,
  Lock,
  Search,
  TriangleAlert,
  Unlock,
  User,
  Video
} from "lucide-react";
import type { CharacterEntity, MineMotionProject, SceneEntity } from "../../project/ProjectFile";
import { getRigDefinition } from "../../rigs/MinecraftRigPresets";
import { makeBoneObjectId } from "../../rigs/RigSelection";
import { useLocalization } from "../../localization/LocalizationContext";
import { collectOutlinerWarnings, filterSceneEntities, matchesOutlinerQuery } from "./OutlinerViewModel";

interface OutlinerPanelProps {
  project: MineMotionProject;
  selectedObjectId: string | null;
  onSelectObject: (objectId: string | null) => void;
  onToggleVisibility: (objectId: string, visible: boolean) => void;
  onToggleLocked: (objectId: string, locked: boolean) => void;
  onSetActiveCamera: (cameraId: string) => void;
}

export function OutlinerPanel({
  project,
  selectedObjectId,
  onSelectObject,
  onToggleVisibility,
  onToggleLocked,
  onSetActiveCamera
}: OutlinerPanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const warnings = useMemo(() => collectOutlinerWarnings(project), [project]);
  const warningIds = useMemo(() => new Set(warnings.map((warning) => warning.entityId)), [warnings]);
  const characters = project.scene.characters.filter((entity) => {
    const definition = getRigDefinition(entity.rigPreset);
    return matchesOutlinerQuery(entity.name, `${definition.name} ${definition.bones.map((bone) => bone.label).join(" ")}`, query);
  });
  const cameras = filterSceneEntities(project.scene.cameras, query, () => t("outliner.entity.camera"));
  const objects = filterSceneEntities(project.scene.importedObjects, query, () => t("outliner.entity.object"));
  const lights = filterSceneEntities(project.scene.lights, query, () => t("outliner.entity.light"));
  const toggleSection = (id: string) => setCollapsed((current) => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const commonActions = { onSelect: onSelectObject, onToggleVisibility, onToggleLocked };

  return (
    <aside className="panel panel-left">
      <div className="panel-header outliner-header">
        <h2>{t("outliner.title")}</h2>
        {warnings.length > 0 && (
          <span className="outliner-warning-count" title={t("outliner.warningCount", { count: warnings.length })}>
            <TriangleAlert size={14} /> {warnings.length}
          </span>
        )}
      </div>
      <label className="outliner-search">
        <Search size={14} aria-hidden="true" />
        <span className="sr-only">{t("outliner.search")}</span>
        <input value={query} placeholder={t("outliner.search")} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="outliner-tree">
        <Section id="scene" title={t("outliner.scene")} collapsed={collapsed.has("scene")} onToggle={toggleSection}>
          {matchesOutlinerQuery(project.world?.sourceName ?? t("outliner.demoWorld"), "world", query) && (
            <OutlinerItem
              icon={<Cuboid size={15} />}
              id="world"
              name={project.world ? project.world.sourceName : t("outliner.demoWorld")}
              selected={selectedObjectId === "world"}
              meta={project.world?.importedChunks?.length
                ? localization.plural({ one: "outliner.chunks.one", other: "outliner.chunks.other" }, project.world.importedChunks.length)
                : project.world ? t("outliner.world.scanned") : t("outliner.world.generated")}
              warning={false}
              {...commonActions}
            />
          )}
        </Section>
        <Section id="characters" title={t("outliner.characters")} collapsed={collapsed.has("characters")} onToggle={toggleSection}>
          {characters.length === 0 ? <p className="empty-note">{t("outliner.noMatches")}</p> : characters.map((entity) => (
            <CharacterItem
              key={entity.id}
              entity={entity}
              selectedObjectId={selectedObjectId}
              boneLabel={t("outliner.bone")}
              warning={warningIds.has(entity.id)}
              query={query}
              {...commonActions}
            />
          ))}
        </Section>
        <Section id="cameras" title={t("outliner.cameras")} collapsed={collapsed.has("cameras")} onToggle={toggleSection}>
          {cameras.map((entity) => (
            <EntityItem
              key={entity.id}
              entity={entity}
              selected={selectedObjectId === entity.id}
              icon={<Camera size={15} />}
              typeLabel={t("outliner.entity.camera")}
              warning={warningIds.has(entity.id)}
              activeCamera={entity.id === project.activeCameraId}
              onSetActiveCamera={onSetActiveCamera}
              {...commonActions}
            />
          ))}
        </Section>
        <Section id="objects" title={t("outliner.objAssets")} collapsed={collapsed.has("objects")} onToggle={toggleSection}>
          {objects.length === 0 ? <p className="empty-note">{query ? t("outliner.noMatches") : t("outliner.noObj")}</p> : objects.map((entity) => (
            <EntityItem key={entity.id} entity={entity} selected={selectedObjectId === entity.id} icon={<Box size={15} />}
              typeLabel={t("outliner.entity.object")} warning={warningIds.has(entity.id)} {...commonActions} />
          ))}
        </Section>
        <Section id="lights" title={t("outliner.lights")} collapsed={collapsed.has("lights")} onToggle={toggleSection}>
          {lights.map((entity) => (
            <EntityItem key={entity.id} entity={entity} selected={selectedObjectId === entity.id} icon={<Lightbulb size={15} />}
              typeLabel={t("outliner.entity.light")} warning={warningIds.has(entity.id)} {...commonActions} />
          ))}
        </Section>
      </div>
    </aside>
  );
}

function CharacterItem({
  entity,
  selectedObjectId,
  boneLabel,
  warning,
  query,
  onSelect,
  onToggleVisibility,
  onToggleLocked
}: {
  entity: CharacterEntity;
  selectedObjectId: string | null;
  boneLabel: string;
  warning: boolean;
  query: string;
  onSelect: (objectId: string | null) => void;
  onToggleVisibility: (objectId: string, visible: boolean) => void;
  onToggleLocked: (objectId: string, locked: boolean) => void;
}) {
  const definition = getRigDefinition(entity.rigPreset);
  return (
    <div className="outliner-character">
      <EntityItem entity={entity} selected={selectedObjectId === entity.id} icon={<User size={15} />}
        typeLabel={definition.name} warning={warning} onSelect={onSelect}
        onToggleVisibility={onToggleVisibility} onToggleLocked={onToggleLocked} />
      <div className="outliner-bones">
        {definition.bones.filter((bone) => bone.id !== "root" && matchesOutlinerQuery(bone.label, boneLabel, query)).map((bone) => {
          const objectId = makeBoneObjectId(entity.id, bone.id);
          return <OutlinerItem key={bone.id} id={objectId} name={bone.label} icon={<GitBranch size={13} />}
            selected={selectedObjectId === objectId} meta={boneLabel} warning={false} onSelect={onSelect}
            onToggleVisibility={onToggleVisibility} onToggleLocked={onToggleLocked} />;
        })}
      </div>
    </div>
  );
}

function Section({ id, title, collapsed, onToggle, children }: {
  id: string;
  title: string;
  collapsed: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <section className="outliner-section">
      <button type="button" className="outliner-section-toggle" onClick={() => onToggle(id)} aria-expanded={!collapsed}>
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}{title}
      </button>
      {!collapsed && <div>{children}</div>}
    </section>
  );
}

function EntityItem({ entity, selected, icon, typeLabel, warning, activeCamera = false, onSetActiveCamera, ...actions }: {
  entity: SceneEntity;
  selected: boolean;
  icon: ReactNode;
  typeLabel?: string;
  warning: boolean;
  activeCamera?: boolean;
  onSetActiveCamera?: (cameraId: string) => void;
  onSelect: (objectId: string | null) => void;
  onToggleVisibility: (objectId: string, visible: boolean) => void;
  onToggleLocked: (objectId: string, locked: boolean) => void;
}) {
  return <OutlinerItem id={entity.id} name={entity.name} icon={icon} selected={selected} meta={typeLabel ?? entity.type}
    warning={warning} visible={entity.visible} locked={entity.locked} activeCamera={activeCamera}
    onSetActiveCamera={onSetActiveCamera} {...actions} />;
}

function OutlinerItem({
  id, name, icon, meta, selected, warning, visible, locked, activeCamera, onSelect,
  onToggleVisibility, onToggleLocked, onSetActiveCamera
}: {
  id: string;
  name: string;
  icon: ReactNode;
  meta: string;
  selected: boolean;
  warning: boolean;
  visible?: boolean;
  locked?: boolean;
  activeCamera?: boolean;
  onSelect: (objectId: string | null) => void;
  onToggleVisibility: (objectId: string, visible: boolean) => void;
  onToggleLocked: (objectId: string, locked: boolean) => void;
  onSetActiveCamera?: (cameraId: string) => void;
}) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  return (
    <div className={`outliner-item-row ${selected ? "selected" : ""}`}>
      <button type="button" className="outliner-item" onClick={() => onSelect(id)}>
        {icon}<span>{name}</span><small>{meta}</small>
        {warning && <TriangleAlert size={12} className="outliner-warning" aria-label={t("outliner.warning")} />}
        {activeCamera && <Video size={12} className="active-camera-dot" aria-label={t("outliner.activeCamera")} />}
      </button>
      {visible !== undefined && (
        <button type="button" className="outliner-icon-button" title={visible ? t("outliner.hide") : t("outliner.show")}
          onClick={() => onToggleVisibility(id, !visible)}>{visible ? <Eye size={13} /> : <EyeOff size={13} />}</button>
      )}
      {locked !== undefined && (
        <button type="button" className="outliner-icon-button" title={locked ? t("outliner.unlock") : t("outliner.lock")}
          onClick={() => onToggleLocked(id, !locked)}>{locked ? <Lock size={13} /> : <Unlock size={13} />}</button>
      )}
      {onSetActiveCamera && !activeCamera && (
        <button type="button" className="outliner-icon-button" title={t("outliner.setActiveCamera")}
          onClick={() => onSetActiveCamera(id)}><Video size={13} /></button>
      )}
    </div>
  );
}
