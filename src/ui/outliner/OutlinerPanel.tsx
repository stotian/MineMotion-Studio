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
  return (
    <aside className="panel panel-left">
      <div className="panel-header">
        <h2>Outliner</h2>
      </div>
      <div className="outliner-tree">
        <Section title="Scene">
          <OutlinerItem
            icon={<Cuboid size={15} />}
            id="world"
            name={project.world ? project.world.sourceName : "Demo World"}
            selected={selectedObjectId === "world"}
            meta={
              project.world?.importedChunks?.length
                ? `${project.world.importedChunks.length} chunks`
                : project.world
                  ? "scanned world"
                  : "generated terrain"
            }
            onSelect={onSelectObject}
          />
        </Section>
        <Section title="Characters">
          {project.scene.characters.map((entity) => (
            <CharacterItem
              key={entity.id}
              entity={entity}
              selectedObjectId={selectedObjectId}
              onSelect={onSelectObject}
            />
          ))}
        </Section>
        <Section title="Cameras">
          {project.scene.cameras.map((entity) => (
            <EntityItem
              key={entity.id}
              entity={entity}
              selected={selectedObjectId === entity.id}
              icon={<Camera size={15} />}
              onSelect={onSelectObject}
            />
          ))}
        </Section>
        <Section title="OBJ Assets">
          {project.scene.importedObjects.length === 0 ? (
            <p className="empty-note">No OBJ objects imported.</p>
          ) : (
            project.scene.importedObjects.map((entity) => (
              <EntityItem
                key={entity.id}
                entity={entity}
                selected={selectedObjectId === entity.id}
                icon={<Box size={15} />}
                onSelect={onSelectObject}
              />
            ))
          )}
        </Section>
        <Section title="Lights">
          {project.scene.lights.map((entity) => (
            <EntityItem
              key={entity.id}
              entity={entity}
              selected={selectedObjectId === entity.id}
              icon={<Lightbulb size={15} />}
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
  onSelect
}: {
  entity: CharacterEntity;
  selectedObjectId: string | null;
  onSelect: (objectId: string | null) => void;
}) {
  const definition = getRigDefinition(entity.rigPreset);
  return (
    <div className="outliner-character">
      <EntityItem
        entity={entity}
        selected={selectedObjectId === entity.id}
        icon={<User size={15} />}
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
                meta="bone"
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
  onSelect
}: {
  entity: SceneEntity;
  selected: boolean;
  icon: React.ReactNode;
  onSelect: (objectId: string | null) => void;
}) {
  return (
    <OutlinerItem
      id={entity.id}
      name={entity.name}
      icon={icon}
      selected={selected}
      meta={entity.type}
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
