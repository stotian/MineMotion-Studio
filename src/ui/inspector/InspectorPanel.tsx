import {
  Bone,
  Camera,
  Eye,
  EyeOff,
  Film,
  FlipHorizontal,
  KeyRound,
  Lock,
  Palette,
  RefreshCw,
  Sparkles,
  Trash2,
  Unlock,
  Upload
} from "lucide-react";
import type { EffectInstance } from "../../effects/EffectTypes";
import type { AnimationPreset } from "../../presets/AnimationPresets";
import type { CameraPreset } from "../../presets/CameraPresets";
import type { RigPosePreset } from "../../presets/RigPosePresets";
import type {
  CharacterEntity,
  MineMotionProject,
  SceneEntity,
  TransformData,
  Vector3Tuple
} from "../../project/ProjectFile";
import { findObject } from "../../project/ProjectStore";
import type { PostProcessingSettings } from "../../rendering/postprocessing/PostProcessingTypes";
import { SKY_PRESETS, type SkyPresetId } from "../../renderer/SkySystem";
import { getRigDefinition, MINECRAFT_RIG_PRESETS } from "../../rigs/MinecraftRigPresets";
import { parseRigBoneSelection } from "../../rigs/RigSelection";
import type { RigPresetId } from "../../rigs/RigTypes";

interface InspectorPanelProps {
  project: MineMotionProject;
  selectedObjectId: string | null;
  selectedEffectId: string | null;
  onUpdateTransform: (objectId: string, transform: TransformData) => void;
  onRenameObject: (objectId: string, name: string) => void;
  onToggleVisibility: (objectId: string, visible: boolean) => void;
  onToggleLocked: (objectId: string, locked: boolean) => void;
  onUpdateEffect: (effectId: string, patch: Partial<EffectInstance>) => void;
  onDeleteEffect: (effectId: string) => void;
  onUpdatePostProcessing: (settings: Partial<PostProcessingSettings>) => void;
  onAddKeyframe: () => void;
  onSkyChange: (preset: SkyPresetId, customColor: string) => void;
  onLookThroughCamera: () => void;
  cameraPresets: CameraPreset[];
  rigPosePresets: RigPosePreset[];
  animationPresets: AnimationPreset[];
  onApplyCameraPreset: (presetId: string) => void;
  onApplyRigPosePreset: (presetId: string) => void;
  onApplyAnimationPreset: (presetId: string) => void;
  onUpdateBoneRotation: (characterId: string, boneId: string, rotation: Vector3Tuple) => void;
  onAddBoneKeyframe: (characterId: string, boneId: string) => void;
  onResetPose: (characterId: string) => void;
  onMirrorPose: (characterId: string) => void;
  onImportSkin: (characterId: string) => void;
  onResetSkin: (characterId: string) => void;
  onChangeRigPreset: (characterId: string, presetId: RigPresetId) => void;
}

export function InspectorPanel({
  project,
  selectedObjectId,
  selectedEffectId,
  onUpdateTransform,
  onRenameObject,
  onToggleVisibility,
  onToggleLocked,
  onUpdateEffect,
  onDeleteEffect,
  onUpdatePostProcessing,
  onAddKeyframe,
  onSkyChange,
  onLookThroughCamera,
  cameraPresets,
  rigPosePresets,
  animationPresets,
  onApplyCameraPreset,
  onApplyRigPosePreset,
  onApplyAnimationPreset,
  onUpdateBoneRotation,
  onAddBoneKeyframe,
  onResetPose,
  onMirrorPose,
  onImportSkin,
  onResetSkin,
  onChangeRigPreset
}: InspectorPanelProps) {
  const boneSelection = parseRigBoneSelection(selectedObjectId);
  const lookup = findObject(project, boneSelection?.characterId ?? selectedObjectId);
  const selectedCharacter =
    boneSelection
      ? project.scene.characters.find((character) => character.id === boneSelection.characterId) ?? null
      : null;
  const selectedEffect =
    project.effects.instances.find((effect) => effect.id === selectedEffectId) ??
    null;

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
      <PostProcessingInspector
        settings={project.postProcessing}
        onUpdate={onUpdatePostProcessing}
      />

      {selectedEffect ? (
        <EffectInspector
          effect={selectedEffect}
          onUpdate={(patch) => onUpdateEffect(selectedEffect.id, patch)}
          onDelete={() => onDeleteEffect(selectedEffect.id)}
        />
      ) : selectedObjectId === "world" ? (
        <WorldInspector project={project} />
      ) : boneSelection && selectedCharacter ? (
        <BoneInspector
          character={selectedCharacter}
          boneId={boneSelection.boneId}
          onUpdateBoneRotation={(rotation) =>
            onUpdateBoneRotation(selectedCharacter.id, boneSelection.boneId, rotation)
          }
          onAddBoneKeyframe={() =>
            onAddBoneKeyframe(selectedCharacter.id, boneSelection.boneId)
          }
          onResetPose={() => onResetPose(selectedCharacter.id)}
          onMirrorPose={() => onMirrorPose(selectedCharacter.id)}
        />
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
          onResetPose={onResetPose}
          onMirrorPose={onMirrorPose}
          onImportSkin={onImportSkin}
          onResetSkin={onResetSkin}
          onChangeRigPreset={onChangeRigPreset}
        />
      ) : (
        <p className="empty-note">Select an object to edit its transform.</p>
      )}
    </aside>
  );
}

function BoneInspector({
  character,
  boneId,
  onUpdateBoneRotation,
  onAddBoneKeyframe,
  onResetPose,
  onMirrorPose
}: {
  character: CharacterEntity;
  boneId: string;
  onUpdateBoneRotation: (rotation: Vector3Tuple) => void;
  onAddBoneKeyframe: () => void;
  onResetPose: () => void;
  onMirrorPose: () => void;
}) {
  const definition = getRigDefinition(character.rigPreset);
  const bone = definition.bones.find((candidate) => candidate.id === boneId);
  const rotation = character.boneRotations[boneId] ?? [0, 0, 0];

  return (
    <section className="inspector-section">
      <h3>
        <Bone size={15} />
        {bone?.label ?? boneId}
      </h3>
      <InfoRow label="Character" value={character.name} />
      <InfoRow label="Rig" value={definition.name} />
      <InfoRow label="Bone ID" value={boneId} />
      <VectorEditor
        label="Bone Rotation"
        value={rotation}
        onChange={onUpdateBoneRotation}
      />
      <div className="inspector-actions">
        <button type="button" onClick={onAddBoneKeyframe}>
          <KeyRound size={15} />
          Add Bone Keyframe
        </button>
        <button type="button" onClick={onMirrorPose}>
          <FlipHorizontal size={15} />
          Mirror Pose
        </button>
        <button type="button" onClick={onResetPose}>
          <RefreshCw size={15} />
          Reset Pose
        </button>
      </div>
    </section>
  );
}

function PostProcessingInspector({
  settings,
  onUpdate
}: {
  settings: PostProcessingSettings;
  onUpdate: (settings: Partial<PostProcessingSettings>) => void;
}) {
  return (
    <section className="inspector-section">
      <h3>
        <Film size={15} />
        Post
      </h3>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(event) => onUpdate({ enabled: event.target.checked })}
        />
        Enable post-processing
      </label>
      <NumberField
        label="Bloom"
        value={settings.bloomIntensity}
        min={0}
        max={1}
        step={0.01}
        onChange={(bloomIntensity) => onUpdate({ bloomIntensity })}
      />
      <NumberField
        label="Vignette"
        value={settings.vignetteAmount}
        min={0}
        max={1}
        step={0.01}
        onChange={(vignetteAmount) => onUpdate({ vignetteAmount })}
      />
      <NumberField
        label="Saturation"
        value={settings.saturation}
        min={0}
        max={2}
        step={0.01}
        onChange={(saturation) => onUpdate({ saturation })}
      />
      <NumberField
        label="Contrast"
        value={settings.contrast}
        min={0.2}
        max={2}
        step={0.01}
        onChange={(contrast) => onUpdate({ contrast })}
      />
      <NumberField
        label="Grain"
        value={settings.grainAmount}
        min={0}
        max={1}
        step={0.01}
        onChange={(grainAmount) => onUpdate({ grainAmount })}
      />
      <NumberField
        label="Pixelate"
        value={settings.pixelationAmount}
        min={0}
        max={1}
        step={0.01}
        onChange={(pixelationAmount) => onUpdate({ pixelationAmount })}
      />
    </section>
  );
}

function EffectInspector({
  effect,
  onUpdate,
  onDelete
}: {
  effect: EffectInstance;
  onUpdate: (patch: Partial<EffectInstance>) => void;
  onDelete: () => void;
}) {
  const updateParameter = (
    key: keyof EffectInstance["parameters"],
    value: string | number | boolean
  ) => {
    onUpdate({
      parameters: {
        ...effect.parameters,
        [key]: value
      }
    });
  };

  return (
    <section className="inspector-section">
      <h3>
        <Sparkles size={15} />
        {effect.name}
      </h3>
      <InfoRow label="Type" value={effect.type} />
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={effect.enabled}
          onChange={(event) => onUpdate({ enabled: event.target.checked })}
        />
        Enabled
      </label>
      <NumberField
        label="Start"
        value={effect.startFrame}
        min={0}
        step={1}
        onChange={(startFrame) => onUpdate({ startFrame: Math.round(startFrame) })}
      />
      <NumberField
        label="Duration"
        value={effect.durationFrames}
        min={1}
        step={1}
        onChange={(durationFrames) =>
          onUpdate({ durationFrames: Math.round(durationFrames) })
        }
      />
      <VectorEditor
        label="Position"
        value={effect.position}
        step={0.1}
        onChange={(position) => onUpdate({ position })}
      />
      {typeof effect.parameters.color === "string" && (
        <label>
          Color
          <input
            type="color"
            value={effect.parameters.color}
            onChange={(event) => updateParameter("color", event.target.value)}
          />
        </label>
      )}
      {typeof effect.parameters.alpha === "number" && (
        <NumberField
          label="Alpha"
          value={effect.parameters.alpha}
          min={0}
          max={1}
          step={0.01}
          onChange={(alpha) => updateParameter("alpha", alpha)}
        />
      )}
      {typeof effect.parameters.intensity === "number" && (
        <NumberField
          label="Intensity"
          value={effect.parameters.intensity}
          min={0}
          max={3}
          step={0.05}
          onChange={(intensity) => updateParameter("intensity", intensity)}
        />
      )}
      {typeof effect.parameters.radius === "number" && (
        <NumberField
          label="Radius"
          value={effect.parameters.radius}
          min={0.1}
          max={12}
          step={0.1}
          onChange={(radius) => updateParameter("radius", radius)}
        />
      )}
      {typeof effect.parameters.strength === "number" && (
        <NumberField
          label="Strength"
          value={effect.parameters.strength}
          min={0}
          max={3}
          step={0.05}
          onChange={(strength) => updateParameter("strength", strength)}
        />
      )}
      {typeof effect.parameters.frequency === "number" && (
        <NumberField
          label="Frequency"
          value={effect.parameters.frequency}
          min={1}
          max={60}
          step={1}
          onChange={(frequency) => updateParameter("frequency", frequency)}
        />
      )}
      {typeof effect.parameters.count === "number" && (
        <NumberField
          label="Count"
          value={effect.parameters.count}
          min={1}
          max={80}
          step={1}
          onChange={(count) => updateParameter("count", Math.round(count))}
        />
      )}
      <div className="inspector-actions">
        <button type="button" onClick={onDelete}>
          <Trash2 size={15} />
          Delete Effect
        </button>
      </div>
    </section>
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
          {world.levelName && <InfoRow label="Level" value={world.levelName} />}
          <InfoRow label="level.dat" value={world.levelDatFound ? "found" : "missing"} />
          {world.spawn && <InfoRow label="Spawn" value={world.spawn.join(", ")} />}
          <InfoRow
            label="Dimension"
            value={world.selectedDimension ?? "overworld"}
          />
          <InfoRow
            label="Chunks"
            value={String(world.importedChunks?.length ?? 0)}
          />
          <InfoRow
            label="Blocks"
            value={String(
              world.performanceEstimate?.importedBlocks ??
                world.importedChunks?.reduce(
                  (sum, chunk) => sum + chunk.blocks.length,
                  0
                ) ??
                0
            )}
          />
          <InfoRow
            label="Unknown"
            value={String(world.unknownBlockCount ?? 0)}
          />
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
  onApplyAnimationPreset,
  onResetPose,
  onMirrorPose,
  onImportSkin,
  onResetSkin,
  onChangeRigPreset
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
  onResetPose: (characterId: string) => void;
  onMirrorPose: (characterId: string) => void;
  onImportSkin: (characterId: string) => void;
  onResetSkin: (characterId: string) => void;
  onChangeRigPreset: (characterId: string, presetId: RigPresetId) => void;
}) {
  const relevantAnimationPresets = animationPresets.filter((preset) =>
    preset.targetTypes.includes(entity.type === "camera" ? "camera" : "character")
  );
  const character = entity.type === "character" ? (entity as CharacterEntity) : null;

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
      {character && (
        <>
          <CharacterRigInspector
            character={character}
            onImportSkin={onImportSkin}
            onResetSkin={onResetSkin}
            onResetPose={onResetPose}
            onMirrorPose={onMirrorPose}
            onChangeRigPreset={onChangeRigPreset}
          />
          <PresetButtonGroup
            title="Pose Library"
            presets={rigPosePresets}
            actionLabel="Apply Pose"
            onApply={onApplyRigPosePreset}
          />
        </>
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

function CharacterRigInspector({
  character,
  onImportSkin,
  onResetSkin,
  onResetPose,
  onMirrorPose,
  onChangeRigPreset
}: {
  character: CharacterEntity;
  onImportSkin: (characterId: string) => void;
  onResetSkin: (characterId: string) => void;
  onResetPose: (characterId: string) => void;
  onMirrorPose: (characterId: string) => void;
  onChangeRigPreset: (characterId: string, presetId: RigPresetId) => void;
}) {
  const definition = getRigDefinition(character.rigPreset);
  const skin = character.skin;

  return (
    <div className="preset-group">
      <h4>Rig And Skin</h4>
      <label>
        Rig Preset
        <select
          value={definition.id}
          onChange={(event) =>
            onChangeRigPreset(character.id, event.target.value as RigPresetId)
          }
        >
          {MINECRAFT_RIG_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
              {preset.status === "placeholder" ? " (placeholder)" : ""}
            </option>
          ))}
        </select>
      </label>
      <InfoRow label="Bones" value={String(definition.bones.length)} />
      <InfoRow label="Arms" value={`${definition.armWidthPixels}px`} />
      {skin ? (
        <>
          <InfoRow label="Skin" value={skin.name} />
          <InfoRow
            label="Resolution"
            value={`${skin.metadata.width}x${skin.metadata.height}`}
          />
          <InfoRow label="Model" value={skin.metadata.modelType} />
          <InfoRow label="Valid" value={skin.metadata.valid ? "yes" : "no"} />
        </>
      ) : (
        <InfoRow label="Skin" value="fallback colors" />
      )}
      <div className="inspector-actions">
        <button type="button" onClick={() => onImportSkin(character.id)}>
          <Upload size={15} />
          Import Skin
        </button>
        <button type="button" onClick={() => onResetSkin(character.id)}>
          <RefreshCw size={15} />
          Reset Skin
        </button>
        <button type="button" onClick={() => onMirrorPose(character.id)}>
          <FlipHorizontal size={15} />
          Mirror Pose
        </button>
        <button type="button" onClick={() => onResetPose(character.id)}>
          <RefreshCw size={15} />
          Reset Pose
        </button>
      </div>
    </div>
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

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        value={Number(value.toFixed(3))}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
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
