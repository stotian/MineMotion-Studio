import { useState } from "react";
import { Bone, Box, Film, RefreshCw, SlidersHorizontal, Upload, X } from "lucide-react";
import type { AnimationPreset } from "../../presets/AnimationPresets";
import type { RigPosePreset } from "../../presets/RigPosePresets";
import type { CharacterEntity, MineMotionProject } from "../../project/ProjectFile";
import { getSelectedCharacterId } from "../../rigs/RigSelection";
import { useLocalization } from "../../localization/LocalizationContext";
import type { RigIKControl } from "../../rigs/IK/IKControl";
import type { RigVector3Tuple } from "../../rigs/RigTypes";

interface RigStudioPanelProps {
  open: boolean;
  project: MineMotionProject;
  selectedObjectId: string | null;
  posePresets: RigPosePreset[];
  animationPresets: AnimationPreset[];
  ikControls: readonly RigIKControl[];
  ikWarnings: readonly string[];
  onClose: () => void;
  onImportSkin: (characterId: string) => void;
  onResetSkin: (characterId: string) => void;
  onApplyPose: (poseId: string) => void;
  onSavePose: (characterId: string) => void;
  onMirrorPose: (characterId: string) => void;
  onResetPose: (characterId: string) => void;
  onApplyAnimation: (presetId: string) => void;
  onImportBlockbench: () => void;
  onUpdateIKControl: (controlId: string, patch: Partial<RigIKControl>) => void;
  onBakeIKControl: (controlId: string) => void;
}

export function RigStudioPanel({
  open,
  project,
  selectedObjectId,
  posePresets,
  animationPresets,
  ikControls,
  ikWarnings,
  onClose,
  onImportSkin,
  onResetSkin,
  onApplyPose,
  onSavePose,
  onMirrorPose,
  onResetPose,
  onApplyAnimation,
  onImportBlockbench,
  onUpdateIKControl,
  onBakeIKControl
}: RigStudioPanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const [selectedIKControlId, setSelectedIKControlId] = useState("ik:leftArm");
  if (!open) return null;

  const selectedCharacterId = getSelectedCharacterId(selectedObjectId);
  const character =
    project.scene.characters.find((item) => item.id === selectedCharacterId) ??
    project.scene.characters[0] ??
    null;
  const rigAnimations = animationPresets.filter((preset) =>
    preset.targetTypes.includes("character")
  );
  const selectedIKControl = ikControls.find((control) => control.id === selectedIKControlId) ?? ikControls[0] ?? null;

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel rig-studio-panel" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>
            <Bone size={18} />
            {t("rig.title")}
          </h2>
          <button type="button" onClick={onClose} aria-label={t("rig.closeAria")}>
            <X size={16} />
          </button>
        </div>
        <div className="rig-studio-layout">
          <section>
            <h3>{t("rig.selectedCharacter")}</h3>
            {character ? (
              <CharacterSummary
                character={character}
                onImportSkin={() => onImportSkin(character.id)}
                onResetSkin={() => onResetSkin(character.id)}
                onSavePose={() => onSavePose(character.id)}
                onMirrorPose={() => onMirrorPose(character.id)}
                onResetPose={() => onResetPose(character.id)}
                labels={{
                  skin: t("rig.skin"),
                  fallbackColors: t("rig.fallbackColors"),
                  resolution: t("rig.resolution"),
                  model: t("rig.model"),
                  status: t("rig.status"),
                  valid: t("rig.valid"),
                  invalid: t("rig.invalid"),
                  importSkin: t("rig.importSkin"),
                  resetSkin: t("rig.resetSkin"),
                  savePose: t("rig.savePose"),
                  mirrorPose: t("rig.mirrorPose"),
                  resetPose: t("rig.resetPose")
                }}
              />
            ) : (
              <p className="empty-note">{t("rig.selectPrompt")}</p>
            )}
          </section>
          <section>
            <h3>{t("rig.poseLibrary")}</h3>
            <div className="preset-actions">
              {posePresets.map((pose) => (
                <button
                  key={pose.id}
                  type="button"
                  disabled={!character}
                  title={pose.description}
                  onClick={() => onApplyPose(pose.id)}
                >
                  {pose.name}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3>
              <Film size={15} />
              {t("rig.animationPresets")}
            </h3>
            <div className="preset-actions">
              {rigAnimations.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={!character}
                  title={preset.description}
                  onClick={() => onApplyAnimation(preset.id)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3>
              <SlidersHorizontal size={15} />
              {t("rig.ik.title")}
            </h3>
            {selectedIKControl ? (
              <div className="rig-ik-controls">
                <div className="info-row">
                  <label htmlFor="rig-ik-limb">{t("rig.ik.target")}</label>
                  <select
                    id="rig-ik-limb"
                    value={selectedIKControl.id}
                    onChange={(event) => setSelectedIKControlId(event.target.value)}
                  >
                    {ikControls.map((control) => (
                      <option key={control.id} value={control.id}>{control.targetLabel}</option>
                    ))}
                  </select>
                </div>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={selectedIKControl.enabled}
                    onChange={(event) => onUpdateIKControl(selectedIKControl.id, { enabled: event.target.checked })}
                  />
                  {t("rig.ik.enabled")}
                </label>
                <label>
                  <span>{t("rig.ik.influence")}: {localization.formatNumber(selectedIKControl.influence)}</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={selectedIKControl.influence}
                    onChange={(event) => onUpdateIKControl(selectedIKControl.id, { influence: Number(event.target.value) })}
                  />
                </label>
                <VectorEditor
                  label={t("rig.ik.position")}
                  value={selectedIKControl.targetPosition}
                  onChange={(targetPosition) => onUpdateIKControl(selectedIKControl.id, { targetPosition })}
                />
                <VectorEditor
                  label={t("rig.ik.pole")}
                  value={selectedIKControl.poleDirection}
                  onChange={(poleDirection) => onUpdateIKControl(selectedIKControl.id, { poleDirection })}
                />
                <div className="info-row">
                  <span>{t("rig.ik.frame")}</span>
                  <strong>{localization.formatNumber(project.animation.currentFrame)}</strong>
                </div>
                <button
                  type="button"
                  disabled={!selectedIKControl.enabled}
                  onClick={() => onBakeIKControl(selectedIKControl.id)}
                >
                  {t("rig.ik.bake")}
                </button>
                <small className="empty-note">{t("rig.ik.sessionNote")}</small>
                {ikWarnings.map((warning) => <small key={warning} className="warning-text">{warning}</small>)}
              </div>
            ) : (
              <p className="empty-note">{character ? t("rig.ik.unsupported") : t("rig.selectPrompt")}</p>
            )}
          </section>
          <section>
            <h3>
              <Box size={15} />
              {t("rig.blockbench")}
            </h3>
            <button type="button" onClick={onImportBlockbench}>
              <Upload size={15} />
              {t("rig.importBlockbench")}
            </button>
            <div className="asset-list">
              {project.rigs.blockbenchModels.length === 0 ? (
                <p className="empty-note">{t("rig.noBlockbench")}</p>
              ) : (
                project.rigs.blockbenchModels.map((model) => (
                  <div key={model.id} className="asset-row">
                    <strong>{model.name}</strong>
                    <small>
                      {t("rig.modelCounts", { cubes: model.elementCount, groups: model.groupCount, textures: model.textureCount })}
                    </small>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function VectorEditor({
  label,
  value,
  onChange
}: {
  label: string;
  value: RigVector3Tuple;
  onChange: (value: RigVector3Tuple) => void;
}) {
  return (
    <fieldset className="rig-vector-editor">
      <legend>{label}</legend>
      {(["X", "Y", "Z"] as const).map((axis, index) => (
        <label key={axis}>
          <span>{axis}</span>
          <input
            type="number"
            min={-10_000}
            max={10_000}
            step={0.05}
            value={value[index]}
            onChange={(event) => {
              const next = [...value] as RigVector3Tuple;
              next[index] = Number(event.target.value);
              onChange(next);
            }}
          />
        </label>
      ))}
    </fieldset>
  );
}

function CharacterSummary({
  character,
  onImportSkin,
  onResetSkin,
  onSavePose,
  onMirrorPose,
  onResetPose,
  labels
}: {
  character: CharacterEntity;
  onImportSkin: () => void;
  onResetSkin: () => void;
  onSavePose: () => void;
  onMirrorPose: () => void;
  onResetPose: () => void;
  labels: {
    skin: string;
    fallbackColors: string;
    resolution: string;
    model: string;
    status: string;
    valid: string;
    invalid: string;
    importSkin: string;
    resetSkin: string;
    savePose: string;
    mirrorPose: string;
    resetPose: string;
  };
}) {
  const skin = character.skin;
  return (
    <>
      <div className="asset-row">
        <strong>{character.name}</strong>
        <small>{character.rigPreset}</small>
      </div>
      <div className="info-row">
        <span>{labels.skin}</span>
        <strong>{skin ? skin.name : labels.fallbackColors}</strong>
      </div>
      {skin && (
        <>
          <div className="info-row">
            <span>{labels.resolution}</span>
            <strong>
              {skin.metadata.width}x{skin.metadata.height}
            </strong>
          </div>
          <div className="info-row">
            <span>{labels.model}</span>
            <strong>{skin.metadata.modelType}</strong>
          </div>
          <div className="info-row">
            <span>{labels.status}</span>
            <strong>{skin.metadata.valid ? labels.valid : labels.invalid}</strong>
          </div>
        </>
      )}
      <div className="inspector-actions">
        <button type="button" onClick={onImportSkin}>
          <Upload size={15} />
          {labels.importSkin}
        </button>
        <button type="button" onClick={onResetSkin}>
          <RefreshCw size={15} />
          {labels.resetSkin}
        </button>
        <button type="button" onClick={onSavePose}>
          {labels.savePose}
        </button>
        <button type="button" onClick={onMirrorPose}>
          {labels.mirrorPose}
        </button>
        <button type="button" onClick={onResetPose}>
          {labels.resetPose}
        </button>
      </div>
    </>
  );
}
