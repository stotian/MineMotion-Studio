import { Camera, Eye, EyeOff, KeyRound, Lock, Palette, Unlock } from "lucide-react";
import type { AnimationPreset } from "../../presets/AnimationPresets";
import type { CameraPreset } from "../../presets/CameraPresets";
import type { RigPosePreset } from "../../presets/RigPosePresets";
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
  onRenameObject: (objectId: string, name: string) => void;
  onToggleVisibility: (objectId: string, visible: boolean) => void;
  onToggleLocked: (objectId: string, locked: boolean) => void;
  onAddKeyframe: () => void;
  onSkyChange: (preset: SkyPresetId, customColor: string) => void;
  onLookThroughCamera: () => void;
  cameraPresets: CameraPreset[];
  rigPosePresets: RigPosePreset[];
  animationPresets: AnimationPreset[];
  onApplyCameraPreset: (presetId: string) => void;
  onApplyRigPosePreset: (presetId: string) => void;
  onApplyAnimationPreset: (presetId: string) => void;
}

export function InspectorPanel({
  project,
  selectedObjectId,
  onUpdateTransform,
  onRenameObject,
  onToggleVisibility,
  onToggleLocked,
  onAddKeyframe,
  onSkyChange,
  onLookThroughCamera,
  cameraPresets,
  rigPosePresets,
  animationPresets,
  onApplyCameraPreset,
  onApplyRigPosePreset,
  onApplyAnimationPreset
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
          cameraPresets={cameraPresets}
          rigPosePresets={rigPosePresets}
          animationPresets={animationPresets}
          onRenameObject={(name) => onRenameObject(lookup.entity.id, name)}
          onToggleVisibility={(visible) =>
            onToggleVisibility(lookup.entity.id, visible)
          }
          onToggleLocked={(locked) => onToggleLocked(lookup.entity.id, locked)}
          onUpdateTransform={(transform) =>
            onUpdateTransform(lookup.entity.id, transform)
          }
          onAddKeyframe={onAddKeyframe}
          onLookThroughCamera={onLookThroughCamera}
          onApplyCameraPreset={onApplyCameraPreset}
          onApplyRigPosePreset={onApplyRigPosePreset}
          onApplyAnimationPreset={onApplyAnimationPreset}
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
  cameraPresets,
  rigPosePresets,
  animationPresets,
  onRenameObject,
  onToggleVisibility,
  onToggleLocked,
  onUpdateTransform,
  onAddKeyframe,
  onLookThroughCamera,
  onApplyCameraPreset,
  onApplyRigPosePreset,
  onApplyAnimationPreset
}: {
  entity: SceneEntity;
  cameraPresets: CameraPreset[];
  rigPosePresets: RigPosePreset[];
  animationPresets: AnimationPreset[];
  onRenameObject: (name: string) => void;
  onToggleVisibility: (visible: boolean) => void;
  onToggleLocked: (locked: boolean) => void;
  onUpdateTransform: (transform: TransformData) => void;
  onAddKeyframe: () => void;
  onLookThroughCamera: () => void;
  onApplyCameraPreset: (presetId: string) => void;
  onApplyRigPosePreset: (presetId: string) => void;
  onApplyAnimationPreset: (presetId: string) => void;
}) {
  const relevantAnimationPresets = animationPresets.filter((preset) =>
    preset.targetTypes.includes(entity.type === "camera" ? "camera" : "character")
  );

  return (
    <section className="inspector-section">
      <h3>{entity.name}</h3>
      <label>
        Name
        <input
          value={entity.name}
          onChange={(event) => onRenameObject(event.target.value)}
        />
      </label>
      <InfoRow label="Type" value={entity.type} />
      <div className="inspector-actions">
        <button
          type="button"
          onClick={() => onToggleVisibility(!entity.visible)}
        >
          {entity.visible ? <Eye size={15} /> : <EyeOff size={15} />}
          {entity.visible ? "Visible" : "Hidden"}
        </button>
        <button type="button" onClick={() => onToggleLocked(!entity.locked)}>
          {entity.locked ? <Lock size={15} /> : <Unlock size={15} />}
          {entity.locked ? "Locked" : "Unlocked"}
        </button>
      </div>
      <VectorEditor
        label="Position"
        value={entity.transform.position}
        disabled={entity.locked}
        onChange={(position) =>
          onUpdateTransform({ ...entity.transform, position })
        }
      />
      <VectorEditor
        label="Rotation"
        value={entity.transform.rotation}
        disabled={entity.locked}
        onChange={(rotation) =>
          onUpdateTransform({ ...entity.transform, rotation })
        }
      />
      <VectorEditor
        label="Scale"
        value={entity.transform.scale}
        step={0.1}
        min={0.01}
        disabled={entity.locked}
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
      {entity.type === "camera" && (
        <PresetButtonGroup
          title="Camera Presets"
          presets={cameraPresets}
          actionLabel="Add Camera Preset"
          onApply={onApplyCameraPreset}
        />
      )}
      {entity.type === "character" && (
        <PresetButtonGroup
          title="Pose Presets"
          presets={rigPosePresets}
          actionLabel="Apply Pose"
          onApply={onApplyRigPosePreset}
        />
      )}
      {(entity.type === "character" || entity.type === "camera") && (
        <PresetButtonGroup
          title="Animation Presets"
          presets={relevantAnimationPresets}
          actionLabel="Apply Animation Preset"
          onApply={onApplyAnimationPreset}
        />
      )}
    </section>
  );
}

function VectorEditor({
  label,
  value,
  step = 0.1,
  min,
  disabled = false,
  onChange
}: {
  label: string;
  value: Vector3Tuple;
  step?: number;
  min?: number;
  disabled?: boolean;
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
            disabled={disabled}
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

function PresetButtonGroup({
  title,
  presets,
  actionLabel,
  onApply
}: {
  title: string;
  presets: Array<{ id: string; name: string; description: string }>;
  actionLabel: string;
  onApply: (presetId: string) => void;
}) {
  if (presets.length === 0) return null;

  return (
    <div className="preset-group">
      <h4>{title}</h4>
      <div className="preset-actions">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            title={preset.description}
            onClick={() => onApply(preset.id)}
          >
            {actionLabel}: {preset.name}
          </button>
        ))}
      </div>
    </div>
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
