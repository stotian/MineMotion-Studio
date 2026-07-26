import { useEffect, useRef, useState } from "react";
import { Bone, Box, Film, RefreshCw, SlidersHorizontal, Upload, X } from "lucide-react";
import type { AnimationPreset } from "../../presets/AnimationPresets";
import type { RigPosePreset } from "../../presets/RigPosePresets";
import type { CharacterEntity, MineMotionProject } from "../../project/ProjectFile";
import { getSelectedCharacterId } from "../../rigs/RigSelection";
import { useLocalization } from "../../localization/LocalizationContext";
import type { RigIKControl } from "../../rigs/IK/IKControl";
import type { RigVector3Tuple } from "../../rigs/RigTypes";
import type { RigPoseWorkspace } from "../../rigs/RigWorkspaceController";
import type { LookAtControl } from "../../rigs/constraints/LookAtControl";
import type { LookAtControlPatch } from "../../rigs/constraints/useLookAtSession";
import type { RigConstraintWorkspace } from "../../rigs/useRigConstraintWorkspace";
import {
  AVAILABLE_PROCEDURAL_ANIMATION_KINDS,
  createDefaultProceduralAnimationSettings,
  PROCEDURAL_ANIMATION_LIMITS,
  type ProceduralAnimationKind,
  type ProceduralAnimationSettings
} from "../../rigs/procedural/ProceduralAnimation";
import { RigPoseControls } from "./RigPoseControls";
import { RigAttachmentControls } from "./RigAttachmentControls";
import type { RigAttachmentWorkspace } from "../../rigs/attachments/useRigAttachmentWorkspace";
import { BlockbenchImportReportCard } from "./BlockbenchImportReportCard";
import type { BlockbenchMappingWorkspace } from "../../rigs/blockbench/useBlockbenchMappingWorkspace";

interface RigStudioPanelProps {
  open: boolean;
  project: MineMotionProject;
  selectedObjectId: string | null;
  posePresets: RigPosePreset[];
  animationPresets: AnimationPreset[];
  constraintWorkspace: RigConstraintWorkspace;
  onClose: () => void;
  onImportSkin: (characterId: string) => void;
  onResetSkin: (characterId: string) => void;
  poseWorkspace: RigPoseWorkspace;
  attachmentWorkspace: RigAttachmentWorkspace;
  blockbenchMappingWorkspace: BlockbenchMappingWorkspace;
  onApplyAnimation: (presetId: string) => void;
  onGenerateProcedural: (settings: ProceduralAnimationSettings) => void;
  onImportBlockbench: () => void;
  onUpdateIKControl: (controlId: string, patch: Partial<RigIKControl>) => void;
  onBakeIKControl: (controlId: string) => void;
  onBakeFootLock: (
    controlId: string,
    startFrame: number,
    endFrame: number,
    groundOffset: number
  ) => void;
  onUpdateLookAtControl: (patch: LookAtControlPatch) => void;
  onBakeLookAt: () => void;
}

export function RigStudioPanel({
  open,
  project,
  selectedObjectId,
  posePresets,
  animationPresets,
  constraintWorkspace,
  onClose,
  onImportSkin,
  onResetSkin,
  poseWorkspace,
  attachmentWorkspace,
  blockbenchMappingWorkspace,
  onApplyAnimation,
  onGenerateProcedural,
  onImportBlockbench,
  onUpdateIKControl,
  onBakeIKControl,
  onBakeFootLock,
  onUpdateLookAtControl,
  onBakeLookAt
}: RigStudioPanelProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const ikControls = constraintWorkspace.ikSession.controls;
  const ikWarnings = constraintWorkspace.ikPreview.warnings;
  const lookAtControl: LookAtControl | null =
    constraintWorkspace.lookAtSession.control;
  const lookAtTargets = constraintWorkspace.lookAtSession.targets;
  const lookAtWarnings = constraintWorkspace.lookAtPreview.warnings;
  const motionPathSession = constraintWorkspace.motionPathSession;
  const [selectedIKControlId, setSelectedIKControlId] = useState("ik:leftArm");
  const [footLockStartFrame, setFootLockStartFrame] = useState(project.animation.currentFrame);
  const [footLockEndFrame, setFootLockEndFrame] = useState(
    Math.min(project.animation.currentFrame + 12, project.animation.durationFrames)
  );
  const [footLockGroundOffset, setFootLockGroundOffset] = useState(0);
  const [proceduralSettings, setProceduralSettings] = useState(
    createDefaultProceduralAnimationSettings
  );
  const wasOpen = useRef(open);
  useEffect(() => {
    if (open && !wasOpen.current) {
      setFootLockStartFrame(project.animation.currentFrame);
      setFootLockEndFrame(
        Math.min(project.animation.currentFrame + 12, project.animation.durationFrames)
      );
    }
    wasOpen.current = open;
  }, [open, project.animation.currentFrame, project.animation.durationFrames]);
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
  const lookAtSubjectName = lookAtControl
    ? [
        ...project.scene.characters,
        ...project.scene.cameras,
        ...project.scene.importedObjects
      ].find((entity) => entity.id === lookAtControl.subject.id)?.name ??
      lookAtControl.subject.id
    : "";
  const lookAtSubjectLabel = lookAtControl?.subject.kind === "head"
    ? t("rig.lookAt.head")
    : lookAtControl?.subject.kind === "camera"
      ? t("rig.lookAt.camera")
      : t("rig.lookAt.object");

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
              <>
                <CharacterSummary
                  character={character}
                  onImportSkin={() => onImportSkin(character.id)}
                  onResetSkin={() => onResetSkin(character.id)}
                  labels={{
                    skin: t("rig.skin"),
                    fallbackColors: t("rig.fallbackColors"),
                    resolution: t("rig.resolution"),
                    model: t("rig.model"),
                    status: t("rig.status"),
                    valid: t("rig.valid"),
                    invalid: t("rig.invalid"),
                    importSkin: t("rig.importSkin"),
                    resetSkin: t("rig.resetSkin")
                  }}
                />
                <RigPoseControls
                  characterId={character.id}
                  workspace={poseWorkspace}
                />
              </>
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
                  onClick={() => poseWorkspace.applyPose(pose.id)}
                >
                  {pose.name}
                </button>
              ))}
            </div>
          </section>
          {character && (
            <section>
              <RigAttachmentControls
                character={character}
                objAssets={project.assets.obj}
                workspace={attachmentWorkspace}
              />
            </section>
          )}
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
            <h3>{t("rig.procedural.title")}</h3>
            <div className="rig-ik-controls">
              <div className="info-row">
                <label htmlFor="rig-procedural-kind">
                  {t("rig.procedural.kind")}
                </label>
                <select
                  id="rig-procedural-kind"
                  value={proceduralSettings.kind}
                  onChange={(event) =>
                    setProceduralSettings(
                      createDefaultProceduralAnimationSettings(
                        event.target.value as ProceduralAnimationKind
                      )
                    )
                  }
                >
                  {AVAILABLE_PROCEDURAL_ANIMATION_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {proceduralKindLabel(kind, t)}
                    </option>
                  ))}
                </select>
              </div>
              <label>
                <span>{t("rig.procedural.duration")}</span>
                <input
                  type="number"
                  min={PROCEDURAL_ANIMATION_LIMITS.minimumDurationFrames}
                  max={PROCEDURAL_ANIMATION_LIMITS.maximumDurationFrames}
                  step={1}
                  value={proceduralSettings.durationFrames}
                  onChange={(event) =>
                    setProceduralSettings((current) => ({
                      ...current,
                      durationFrames: event.target.valueAsNumber
                    }))
                  }
                />
              </label>
              <label>
                <span>
                  {t("rig.procedural.intensity")}:{" "}
                  {localization.formatNumber(proceduralSettings.intensity)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={PROCEDURAL_ANIMATION_LIMITS.maximumIntensity}
                  step={0.05}
                  value={proceduralSettings.intensity}
                  onChange={(event) =>
                    setProceduralSettings((current) => ({
                      ...current,
                      intensity: event.target.valueAsNumber
                    }))
                  }
                />
              </label>
              {proceduralKindUsesCycles(proceduralSettings.kind) && (
                <label>
                  <span>{t("rig.procedural.cycles")}</span>
                  <input
                    type="number"
                    min={1}
                    max={PROCEDURAL_ANIMATION_LIMITS.maximumCycles}
                    step={1}
                    value={proceduralSettings.cycles}
                    onChange={(event) =>
                      setProceduralSettings((current) => ({
                        ...current,
                        cycles: event.target.valueAsNumber
                      }))
                    }
                  />
                </label>
              )}
              {proceduralKindUsesDirection(proceduralSettings.kind) && (
                <div className="info-row">
                  <label htmlFor="rig-procedural-direction">
                    {t("rig.procedural.direction")}
                  </label>
                  <select
                    id="rig-procedural-direction"
                    value={proceduralSettings.direction}
                    onChange={(event) =>
                      setProceduralSettings((current) => ({
                        ...current,
                        direction: Number(event.target.value) === -1 ? -1 : 1
                      }))
                    }
                  >
                    <option value={1}>{t("rig.procedural.forward")}</option>
                    <option value={-1}>{t("rig.procedural.reverse")}</option>
                  </select>
                </div>
              )}
              <button
                type="button"
                disabled={!character}
                onClick={() =>
                  onGenerateProcedural(proceduralSettings)
                }
              >
                {t("rig.procedural.generate")}
              </button>
              <small className="empty-note">{t("rig.procedural.note")}</small>
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
                {(selectedIKControl.limb === "leftLeg" || selectedIKControl.limb === "rightLeg") && (
                  <fieldset className="rig-foot-lock-controls">
                    <legend>{t("rig.footLock.title")}</legend>
                    <label>
                      <span>{t("rig.footLock.start")}</span>
                      <input
                        type="number"
                        min={0}
                        max={project.animation.durationFrames}
                        step={1}
                        value={footLockStartFrame}
                        onChange={(event) => setFootLockStartFrame(Number(event.target.value))}
                      />
                    </label>
                    <label>
                      <span>{t("rig.footLock.end")}</span>
                      <input
                        type="number"
                        min={0}
                        max={project.animation.durationFrames}
                        step={1}
                        value={footLockEndFrame}
                        onChange={(event) => setFootLockEndFrame(Number(event.target.value))}
                      />
                    </label>
                    <label>
                      <span>{t("rig.footLock.offset")}</span>
                      <input
                        type="number"
                        min={-4}
                        max={4}
                        step={0.01}
                        value={footLockGroundOffset}
                        onChange={(event) => setFootLockGroundOffset(Number(event.target.value))}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => onBakeFootLock(
                        selectedIKControl.id,
                        footLockStartFrame,
                        footLockEndFrame,
                        footLockGroundOffset
                      )}
                    >
                      {t("rig.footLock.bake")}
                    </button>
                    <small className="empty-note">{t("rig.footLock.note")}</small>
                  </fieldset>
                )}
                <small className="empty-note">{t("rig.ik.sessionNote")}</small>
                {ikWarnings.map((warning) => <small key={warning} className="warning-text">{warning}</small>)}
              </div>
            ) : (
              <p className="empty-note">{character ? t("rig.ik.unsupported") : t("rig.selectPrompt")}</p>
            )}
          </section>
          <section>
            <h3>{t("rig.lookAt.title")}</h3>
            {lookAtControl ? (
              <div className="rig-ik-controls">
                <div className="info-row">
                  <span>{t("rig.lookAt.subject")}</span>
                  <strong>{lookAtSubjectLabel}: {lookAtSubjectName}</strong>
                </div>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={lookAtControl.enabled}
                    onChange={(event) =>
                      onUpdateLookAtControl({ enabled: event.target.checked })
                    }
                  />
                  {t("rig.lookAt.enabled")}
                </label>
                <div className="info-row">
                  <label htmlFor="rig-look-at-target">{t("rig.lookAt.target")}</label>
                  <select
                    id="rig-look-at-target"
                    value={lookAtControl.targetId ?? "__custom__"}
                    onChange={(event) => onUpdateLookAtControl({
                      targetId: event.target.value === "__custom__"
                        ? null
                        : event.target.value
                    })}
                  >
                    <option value="__custom__">{t("rig.lookAt.customTarget")}</option>
                    {lookAtTargets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.name} ({target.type})
                      </option>
                    ))}
                  </select>
                </div>
                {lookAtControl.targetId === null && (
                  <VectorEditor
                    label={t("rig.lookAt.position")}
                    value={lookAtControl.targetPosition}
                    onChange={(targetPosition) =>
                      onUpdateLookAtControl({ targetPosition })
                    }
                  />
                )}
                <label>
                  <span>
                    {t("rig.lookAt.influence")}:{" "}
                    {localization.formatNumber(lookAtControl.influence)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={lookAtControl.influence}
                    onChange={(event) =>
                      onUpdateLookAtControl({ influence: Number(event.target.value) })
                    }
                  />
                </label>
                <VectorEditor
                  label={t("rig.lookAt.maxAngle")}
                  value={lookAtControl.maxAngle}
                  min={0}
                  max={180}
                  step={1}
                  onChange={(maxAngle) => onUpdateLookAtControl({ maxAngle })}
                />
                <div className="info-row">
                  <span>{t("rig.lookAt.frame")}</span>
                  <strong>{localization.formatNumber(project.animation.currentFrame)}</strong>
                </div>
                <button
                  type="button"
                  disabled={!lookAtControl.enabled}
                  onClick={onBakeLookAt}
                >
                  {t("rig.lookAt.bake")}
                </button>
                <small className="empty-note">{t("rig.lookAt.sessionNote")}</small>
                {lookAtControl.subject.kind === "head" && (
                  <small className="empty-note">{t("rig.lookAt.eyePlaceholder")}</small>
                )}
                {lookAtWarnings.map((warning) => (
                  <small key={warning} className="warning-text">{warning}</small>
                ))}
              </div>
            ) : (
              <p className="empty-note">{t("rig.lookAt.unsupported")}</p>
            )}
          </section>
          <section>
            <h3>{t("rig.motionPath.title")}</h3>
            {motionPathSession.control ? (
              <div className="rig-ik-controls">
                <div className="info-row">
                  <label htmlFor="rig-motion-path-subject">
                    {t("rig.motionPath.subject")}
                  </label>
                  <select
                    id="rig-motion-path-subject"
                    value={`${motionPathSession.control.kind}|${motionPathSession.control.subjectId}`}
                    onChange={(event) => {
                      const option = motionPathSession.options.find(
                        (entry) => entry.key === event.target.value
                      );
                      if (option) {
                        motionPathSession.updateControl({
                          kind: option.kind,
                          subjectId: option.subjectId
                        });
                      }
                    }}
                  >
                    {motionPathSession.options.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.name} — {motionPathKindLabel(option.kind, t)}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={motionPathSession.control.visible}
                    onChange={(event) =>
                      motionPathSession.updateControl({ visible: event.target.checked })
                    }
                  />
                  {t("rig.motionPath.visible")}
                </label>
                <fieldset className="rig-foot-lock-controls">
                  <legend>{t("rig.motionPath.range")}</legend>
                  <label>
                    <span>{t("rig.motionPath.start")}</span>
                    <input
                      type="number"
                      min={0}
                      max={project.animation.durationFrames}
                      step={1}
                      value={motionPathSession.control.startFrame}
                      onChange={(event) =>
                        motionPathSession.updateControl({
                          startFrame: Number(event.target.value)
                        })
                      }
                    />
                  </label>
                  <label>
                    <span>{t("rig.motionPath.end")}</span>
                    <input
                      type="number"
                      min={motionPathSession.control.startFrame}
                      max={project.animation.durationFrames}
                      step={1}
                      value={motionPathSession.control.endFrame}
                      onChange={(event) =>
                        motionPathSession.updateControl({
                          endFrame: Number(event.target.value)
                        })
                      }
                    />
                  </label>
                </fieldset>
                {motionPathSession.path && (
                  <>
                    <div className="info-row">
                      <span>{t("rig.motionPath.duration")}</span>
                      <strong>
                        {t("rig.motionPath.durationValue", {
                          frames: motionPathSession.path.durationFrames,
                          seconds: localization.formatNumber(
                            motionPathSession.path.durationSeconds
                          )
                        })}
                      </strong>
                    </div>
                    <div className="info-row">
                      <span>{t("rig.motionPath.distance")}</span>
                      <strong>
                        {localization.formatNumber(motionPathSession.path.distance)}
                      </strong>
                    </div>
                    <div className="info-row">
                      <span>{t("rig.motionPath.points")}</span>
                      <strong>
                        {t("rig.motionPath.pointsValue", {
                          points: motionPathSession.path.points.length,
                          keys: motionPathSession.path.keyframeFrames.length
                        })}
                      </strong>
                    </div>
                  </>
                )}
                {motionPathSession.error && (
                  <small className="warning-text">{motionPathSession.error}</small>
                )}
                <small className="empty-note">{t("rig.motionPath.sessionNote")}</small>
              </div>
            ) : (
              <p className="empty-note">{t("rig.motionPath.unavailable")}</p>
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
              {project.assets.blockbench.length === 0 ? (
                <p className="empty-note">{t("rig.noBlockbench")}</p>
              ) : (
                project.assets.blockbench.map((model) => (
                  <BlockbenchImportReportCard
                    key={model.id}
                    model={model}
                    character={character}
                    mappingWorkspace={blockbenchMappingWorkspace}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function motionPathKindLabel(
  kind: "characterRoot" | "leftHand" | "rightHand" | "camera",
  t: ReturnType<typeof useLocalization>["t"]
): string {
  if (kind === "characterRoot") return t("rig.motionPath.root");
  if (kind === "leftHand") return t("rig.motionPath.leftHand");
  if (kind === "rightHand") return t("rig.motionPath.rightHand");
  return t("rig.motionPath.camera");
}

function proceduralKindLabel(
  kind: ProceduralAnimationKind,
  t: ReturnType<typeof useLocalization>["t"]
): string {
  if (kind === "idle") return t("rig.procedural.idle");
  if (kind === "walk") return t("rig.procedural.walk");
  if (kind === "run") return t("rig.procedural.run");
  if (kind === "crouch") return t("rig.procedural.crouch");
  if (kind === "jump") return t("rig.procedural.jump");
  if (kind === "landing") return t("rig.procedural.landing");
  if (kind === "recoil") return t("rig.procedural.recoil");
  if (kind === "hitReaction") return t("rig.procedural.hitReaction");
  if (kind === "swordSwing") return t("rig.procedural.swordSwing");
  if (kind === "turn") return t("rig.procedural.turn");
  return kind;
}

function proceduralKindUsesCycles(kind: ProceduralAnimationKind): boolean {
  return ["idle", "walk", "run", "crouch"].includes(kind);
}

function proceduralKindUsesDirection(kind: ProceduralAnimationKind): boolean {
  return [
    "walk",
    "run",
    "crouch",
    "recoil",
    "hitReaction",
    "swordSwing",
    "turn"
  ].includes(kind);
}

function VectorEditor({
  label,
  value,
  onChange,
  min = -10_000,
  max = 10_000,
  step = 0.05
}: {
  label: string;
  value: RigVector3Tuple;
  onChange: (value: RigVector3Tuple) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <fieldset className="rig-vector-editor">
      <legend>{label}</legend>
      {(["X", "Y", "Z"] as const).map((axis, index) => (
        <label key={axis}>
          <span>{axis}</span>
          <input
            type="number"
            min={min}
            max={max}
            step={step}
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
  labels
}: {
  character: CharacterEntity;
  onImportSkin: () => void;
  onResetSkin: () => void;
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
      </div>
    </>
  );
}
