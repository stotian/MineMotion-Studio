import {
  Box,
  Camera,
  ChevronDown,
  Circle,
  Cuboid,
  GitBranch,
  Lightbulb,
  User
} from "lucide-react";
import type { CharacterEntity, MineMotionProject, SceneEntity } from "../../project/ProjectFile";
import { getRigDefinition } from "../../rigs/MinecraftRigPresets";
import { makeBoneObjectId } from "../../rigs/RigSelection";
import { useLocalization } from "../../localization/LocalizationContext";

interface OutlinerPanelProps {
  project: MineMotionProject;
  selectedObjectId: string | null;
  onSelectObject: (objectId: string | null) => void;
}

export function OutlinerPanel({
  project,
  selectedObjectId,
  onSelectObject
}: OutlinerPanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  return (
    <aside className="panel panel-left">
      <div className="panel-header">
        <h2>{t("outliner.title")}</h2>
      </div>
      <div className="outliner-tree">
        <Section title={t("outliner.scene")}>
          <OutlinerItem
            icon={<Cuboid size={15} />}
            id="world"
            name={project.world ? project.world.sourceName : t("outliner.demoWorld")}
            selected={selectedObjectId === "world"}
            meta={
              project.world?.importedChunks?.length
                ? localization.plural(
                    { one: "outliner.chunks.one", other: "outliner.chunks.other" },
                    project.world.importedChunks.length
                  )
                : project.world
                  ? t("outliner.world.scanned")
                  : t("outliner.world.generated")
            }
            onSelect={onSelectObject}
          />
        </Section>
        <Section title={t("outliner.characters")}>
          {project.scene.characters.map((entity) => (
            <CharacterItem
              key={entity.id}
              entity={entity}
              selectedObjectId={selectedObjectId}
              boneLabel={t("outliner.bone")}
              onSelect={onSelectObject}
            />
          ))}
        </Section>
        <Section title={t("outliner.cameras")}>
          {project.scene.cameras.map((entity) => (
            <EntityItem
              key={entity.id}
              entity={entity}
              selected={selectedObjectId === entity.id}
              icon={<Camera size={15} />}
              typeLabel={t("outliner.entity.camera")}
              onSelect={onSelectObject}
            />
          ))}
        </Section>
        <Section title={t("outliner.objAssets")}>
          {project.scene.importedObjects.length === 0 ? (
            <p className="empty-note">{t("outliner.noObj")}</p>
          ) : (
            project.scene.importedObjects.map((entity) => (
              <EntityItem
                key={entity.id}
                entity={entity}
                selected={selectedObjectId === entity.id}
                icon={<Box size={15} />}
                typeLabel={t("outliner.entity.object")}
                onSelect={onSelectObject}
              />
            ))
          )}
        </Section>
        <Section title={t("outliner.lights")}>
          {project.scene.lights.map((entity) => (
            <EntityItem
              key={entity.id}
              entity={entity}
              selected={selectedObjectId === entity.id}
              icon={<Lightbulb size={15} />}
              typeLabel={t("outliner.entity.light")}
              onSelect={onSelectObject}
            />
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
  onSelect
}: {
  entity: CharacterEntity;
  selectedObjectId: string | null;
  boneLabel: string;
  onSelect: (objectId: string | null) => void;
}) {
  const definition = getRigDefinition(entity.rigPreset);
  return (
    <div className="outliner-character">
      <EntityItem
        entity={entity}
        selected={selectedObjectId === entity.id}
        icon={<User size={15} />}
        typeLabel={undefined}
        onSelect={onSelect}
      />
      <div className="outliner-bones">
        {definition.bones
          .filter((bone) => bone.id !== "root")
          .map((bone) => {
            const objectId = makeBoneObjectId(entity.id, bone.id);
            return (
              <OutlinerItem
                key={bone.id}
                id={objectId}
                name={bone.label}
                icon={<GitBranch size={13} />}
                selected={selectedObjectId === objectId}
                meta={boneLabel}
                onSelect={onSelect}
              />
            );
          })}
      </div>
    </div>
  );
}

function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="outliner-section">
      <h3>
        <ChevronDown size={14} />
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function EntityItem({
  entity,
  selected,
  icon,
  typeLabel,
  onSelect
}: {
  entity: SceneEntity;
  selected: boolean;
  icon: React.ReactNode;
  typeLabel?: string;
  onSelect: (objectId: string | null) => void;
}) {
  return (
    <OutlinerItem
      id={entity.id}
      name={entity.name}
      icon={icon}
      selected={selected}
      meta={typeLabel ?? entity.type}
      onSelect={onSelect}
    />
  );
}

function OutlinerItem({
  id,
  name,
  icon,
  meta,
  selected,
  onSelect
}: {
  id: string;
  name: string;
  icon: React.ReactNode;
  meta: string;
  selected: boolean;
  onSelect: (objectId: string | null) => void;
}) {
  return (
    <button
      type="button"
      className={`outliner-item ${selected ? "selected" : ""}`}
      onClick={() => onSelect(id)}
    >
      {icon}
      <span>{name}</span>
      <small>{meta}</small>
      <Circle size={7} className="visibility-dot" />
    </button>
  );
}
