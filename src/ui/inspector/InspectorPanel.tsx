import { Camera, KeyRound, Palette } from "lucide-react";
import type {
  MineMotionProject,
  SceneEntity,
  TransformData,
  Vector3Tuple
} from "../../project/ProjectFile";
import { findObject } from "../../project/ProjectStore";
import { SKY_PRESETS, type SkyPresetId } from "../../renderer/SkySystem";

interface InspectorPanelProps {
  project: MineMotionProject;
  selectedObjectId: string | null;
  onUpdateTransform: (objectId: string, transform: TransformData) => void;
  onAddKeyframe: () => void;
  onSkyChange: (preset: SkyPresetId, customColor: string) => void;
  onLookThroughCamera: () => void;
}

export function InspectorPanel({
  project,
  selectedObjectId,
  onUpdateTransform,
  onAddKeyframe,
  onSkyChange,
  onLookThroughCamera
}: InspectorPanelProps) {
  const lookup = findObject(project, selectedObjectId);

  return (
    <aside className="panel panel-right">
      <div className="panel-header">
        <h2>Inspector</h2>
      </div>
      <section className="inspector-section">
        <h3>
          <Palette size={15} />
          Sky
        </h3>
        <label>
          Preset
          <select
            value={project.sky.preset}
            onChange={(event) =>
              onSkyChange(event.target.value as SkyPresetId, project.sky.customColor)
            }
          >
            {Object.values(SKY_PRESETS).map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Custom Color
          <input
            type="color"
            value={project.sky.customColor}
            onChange={(event) =>
              onSkyChange(project.sky.preset, event.target.value)
            }
          />
        </label>
      </section>

      {selectedObjectId === "world" ? (
        <WorldInspector project={project} />
      ) : lookup ? (
        <EntityInspector
          entity={lookup.entity}
          onUpdateTransform={(transform) =>
            onUpdateTransform(lookup.entity.id, transform)
          }
          onAddKeyframe={onAddKeyframe}
          onLookThroughCamera={onLookThroughCamera}
        />
      ) : (
        <p className="empty-note">Select an object to edit its transform.</p>
      )}
    </aside>
  );
}

function WorldInspector({ project }: { project: MineMotionProject }) {
  const world = project.world;
  return (
    <section className="inspector-section">
      <h3>World</h3>
      {world ? (
        <>
          <InfoRow label="Source" value={world.sourceName} />
          <InfoRow label="level.dat" value={world.levelDatFound ? "found" : "missing"} />
          {world.dimensions.map((dimension) => (
            <InfoRow
              key={dimension.id}
              label={dimension.label}
              value={`${dimension.regionFiles.length} region files`}
            />
          ))}
          {world.notes.length > 0 && (
            <ul className="notes-list">
              {world.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="empty-note">
          Demo terrain is active until a Minecraft world folder is scanned.
        </p>
      )}
    </section>
  );
}

function EntityInspector({
  entity,
  onUpdateTransform,
  onAddKeyframe,
  onLookThroughCamera
}: {
  entity: SceneEntity;
  onUpdateTransform: (transform: TransformData) => void;
  onAddKeyframe: () => void;
  onLookThroughCamera: () => void;
}) {
  return (
    <section className="inspector-section">
      <h3>{entity.name}</h3>
      <InfoRow label="Type" value={entity.type} />
      <VectorEditor
        label="Position"
        value={entity.transform.position}
        onChange={(position) =>
          onUpdateTransform({ ...entity.transform, position })
        }
      />
      <VectorEditor
        label="Rotation"
        value={entity.transform.rotation}
        onChange={(rotation) =>
          onUpdateTransform({ ...entity.transform, rotation })
        }
      />
      <VectorEditor
        label="Scale"
        value={entity.transform.scale}
        step={0.1}
        min={0.01}
        onChange={(scale) => onUpdateTransform({ ...entity.transform, scale })}
      />
      <div className="inspector-actions">
        <button type="button" onClick={onAddKeyframe}>
          <KeyRound size={15} />
          Add Keyframe
        </button>
        {entity.type === "camera" && (
          <button type="button" onClick={onLookThroughCamera}>
            <Camera size={15} />
            Look Through
          </button>
        )}
      </div>
    </section>
  );
}

function VectorEditor({
  label,
  value,
  step = 0.1,
  min,
  onChange
}: {
  label: string;
  value: Vector3Tuple;
  step?: number;
  min?: number;
  onChange: (value: Vector3Tuple) => void;
}) {
  const axes = ["X", "Y", "Z"] as const;
  return (
    <fieldset className="vector-editor">
      <legend>{label}</legend>
      {axes.map((axis, index) => (
        <label key={axis}>
          {axis}
          <input
            type="number"
            step={step}
            min={min}
            value={Number(value[index].toFixed(3))}
            onChange={(event) => {
              const next = [...value] as Vector3Tuple;
              next[index] = Number(event.target.value);
              onChange(next);
            }}
          />
        </label>
      ))}
    </fieldset>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

