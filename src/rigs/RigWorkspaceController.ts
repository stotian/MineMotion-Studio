import { useCallback, useState } from "react";
import type { TranslationKey, TranslationValues } from "../localization/LocalizationTypes";
import { presetRegistry } from "../presets/PresetRegistry";
import { applyRigPosePreset } from "../presets/RigPosePresets";
import { syncCinematicTimeline } from "../project/CinematicTimeline";
import type { MineMotionProject } from "../project/ProjectFile";
import { addBoneRotationKeyframe, updateProjectBoneRotation } from "./RigController";
import { getDefaultBoneRotations } from "./RigDefinition";
import { savePoseFromCharacter } from "./RigInstance";
import { getRigDefinition } from "./MinecraftRigPresets";
import { getSelectedCharacterId } from "./RigSelection";
import type { RigPresetId } from "./RigTypes";
import {
  copyCharacterPose,
  mirrorProjectCharacterPose,
  pasteProjectCharacterPose,
  resetProjectCharacterPose,
  type RigPoseClipboard
} from "./PoseCommands";
import { bakeProjectFootLockRange } from "./IK/FootLockBakeController";
import { bakeProjectRigIKControl } from "./IK/RigIKController";
import type { RigIKSession } from "./IK/useRigIKSession";
import { bakeProjectLookAt } from "./constraints/LookAtController";
import type { LookAtSession } from "./constraints/useLookAtSession";
import {
  bakeProceduralAnimation,
  type ProceduralAnimationSettings
} from "./procedural/ProceduralAnimationController";
import { useRigAttachmentWorkspace } from "./attachments/useRigAttachmentWorkspace";

type ProjectCommit = (
  updater: MineMotionProject | ((current: MineMotionProject) => MineMotionProject),
  label: string
) => boolean;

interface RigWorkspaceControllerOptions {
  project: MineMotionProject;
  selectedObjectId: string | null;
  ikSession: RigIKSession;
  lookAtSession: LookAtSession;
  commitProject: ProjectCommit;
  setStatus: (status: string) => void;
  tr: (key: TranslationKey, values?: TranslationValues) => string;
}

export interface RigPoseWorkspace {
  hasClipboard: boolean;
  applyPose: (presetId: string) => void;
  saveCurrentPose: (characterId: string) => void;
  copyPose: (characterId: string) => void;
  pastePose: (characterId: string) => void;
  blendPose: (characterId: string, influence: number) => void;
  mirrorPose: (characterId: string) => void;
  resetPose: (characterId: string) => void;
}

export function useRigWorkspaceController({
  project,
  selectedObjectId,
  ikSession,
  lookAtSession,
  commitProject,
  setStatus,
  tr
}: RigWorkspaceControllerOptions) {
  const [poseClipboard, setPoseClipboard] = useState<RigPoseClipboard | null>(
    null
  );
  const attachmentWorkspace = useRigAttachmentWorkspace({
    project,
    commitProject,
    setStatus,
    tr
  });
  const updateBoneRotation = useCallback(
    (characterId: string, boneId: string, rotation: [number, number, number]) => {
      const character = project.scene.characters.find((item) => item.id === characterId);
      if (character?.locked) {
        setStatus(tr("app.entityLocked", { name: character.name }));
        return;
      }
      commitProject(
        (current) => updateProjectBoneRotation(current, characterId, boneId, rotation),
        "Edit bone rotation"
      );
      setStatus(tr("app.boneUpdated", { bone: boneId }));
    },
    [commitProject, project.scene.characters, setStatus, tr]
  );

  const addBoneKeyframe = useCallback((characterId: string, boneId: string) => {
    commitProject(
      (current) => syncCinematicTimeline(addBoneRotationKeyframe(
        current,
        characterId,
        boneId,
        current.animation.currentFrame
      )),
      "Add bone keyframe"
    );
    setStatus(tr("app.boneKey", { bone: boneId, frame: project.animation.currentFrame }));
  }, [commitProject, project.animation.currentFrame, setStatus, tr]);

  const resetPose = useCallback((characterId: string) => {
    const result = resetProjectCharacterPose(project, characterId);
    if (!result.changed) {
      setStatus(poseCommandError(result.error, project, characterId, tr));
      return;
    }
    commitProject(result.project, tr("history.resetPose"));
    setStatus(tr("app.poseReset"));
  }, [commitProject, project, setStatus, tr]);

  const mirrorPose = useCallback((characterId: string) => {
    const result = mirrorProjectCharacterPose(project, characterId);
    if (!result.changed) {
      setStatus(poseCommandError(result.error, project, characterId, tr));
      return;
    }
    commitProject(result.project, tr("history.mirrorPose"));
    setStatus(tr("app.poseMirrored"));
  }, [commitProject, project, setStatus, tr]);

  const copyPose = useCallback((characterId: string) => {
    const character = project.scene.characters.find(
      (candidate) => candidate.id === characterId
    );
    if (!character) {
      setStatus(tr("app.poseUnavailable"));
      return;
    }
    setPoseClipboard(copyCharacterPose(character));
    setStatus(tr("app.poseCopied", { name: character.name }));
  }, [project.scene.characters, setStatus, tr]);

  const pastePose = useCallback((characterId: string) => {
    const result = pasteProjectCharacterPose(
      project,
      characterId,
      poseClipboard
    );
    if (!result.changed) {
      setStatus(poseCommandError(result.error, project, characterId, tr));
      return;
    }
    commitProject(result.project, tr("history.pastePose"));
    setStatus(tr("app.posePasted"));
  }, [commitProject, poseClipboard, project, setStatus, tr]);

  const blendPose = useCallback((
    characterId: string,
    influence: number
  ) => {
    const result = pasteProjectCharacterPose(
      project,
      characterId,
      poseClipboard,
      influence
    );
    if (!result.changed) {
      setStatus(poseCommandError(result.error, project, characterId, tr));
      return;
    }
    commitProject(result.project, tr("history.blendPose"));
    setStatus(tr("app.poseBlended", {
      percent: Math.round(Math.min(1, Math.max(0, influence)) * 100)
    }));
  }, [commitProject, poseClipboard, project, setStatus, tr]);

  const saveCurrentPose = useCallback((characterId: string) => {
    const character = project.scene.characters.find((item) => item.id === characterId);
    if (!character) return;
    const name = window.prompt(tr("app.posePrompt"), tr("app.poseDefault", { name: character.name }));
    if (!name) return;
    const pose = savePoseFromCharacter(character, name);
    commitProject((current) => ({
      ...current,
      rigs: { ...current.rigs, savedPoses: [...current.rigs.savedPoses, pose] }
    }), "Save current pose");
    setStatus(tr("app.poseSaved", { name: pose.name }));
  }, [commitProject, project.scene.characters, setStatus, tr]);

  const changeRigPreset = useCallback((characterId: string, presetId: RigPresetId) => {
    const definition = getRigDefinition(presetId);
    commitProject((current) => ({
      ...current,
      scene: {
        ...current.scene,
        characters: current.scene.characters.map((character) => character.id === characterId ? {
          ...character,
          rigPreset: definition.id,
          modelType: definition.modelType,
          boneRotations: { ...getDefaultBoneRotations(definition), ...character.boneRotations }
        } : character)
      }
    }), "Change rig preset");
    setStatus(tr("app.rigChanged", { name: definition.name }));
  }, [commitProject, setStatus, tr]);

  const applyPose = useCallback((presetId: string) => {
    const characterId = getSelectedCharacterId(selectedObjectId) ?? project.scene.characters[0]?.id;
    if (!characterId) return;
    const preset = presetRegistry.getRigPosePreset(presetId) ??
      project.rigs.savedPoses.find((candidate) => candidate.id === presetId);
    if (!preset) return;
    const changed = commitProject((current) => {
      let poseChanged = false;
      const characters = current.scene.characters.map((character) => {
        if (character.id !== characterId || character.locked) return character;
        const transformed = applyRigPosePreset(character, preset);
        if (transformed !== character) poseChanged = true;
        return transformed;
      });
      return poseChanged
        ? { ...current, scene: { ...current.scene, characters } }
        : current;
    }, tr("history.applyPose"));
    setStatus(changed
      ? tr("app.poseApplied", { name: preset.name })
      : tr("app.poseUnchanged"));
  }, [commitProject, project.rigs.savedPoses, project.scene.characters, selectedObjectId, setStatus, tr]);

  const applyAnimation = useCallback((presetId: string) => {
    const targetId = getSelectedCharacterId(selectedObjectId) ?? project.scene.characters[0]?.id;
    if (!targetId) return;
    const preset = presetRegistry.getAnimationPreset(presetId);
    if (!preset) return;
    commitProject((current) => syncCinematicTimeline(preset.apply(current, targetId)), "Apply animation preset");
    setStatus(tr("app.animationPreset", { name: preset.name }));
  }, [commitProject, project.scene.characters, selectedObjectId, setStatus, tr]);

  const generateProceduralAnimation = useCallback((
    settings: ProceduralAnimationSettings
  ) => {
    const targetId =
      getSelectedCharacterId(selectedObjectId) ?? project.scene.characters[0]?.id;
    if (!targetId) {
      setStatus(tr("app.proceduralUnavailable"));
      return;
    }
    const result = bakeProceduralAnimation(project, targetId, settings);
    if (!result.changed) {
      setStatus(result.error ?? tr("app.proceduralUnavailable"));
      return;
    }
    commitProject(result.project, tr("history.generateProcedural"));
    setStatus(tr("app.proceduralGenerated"));
  }, [
    commitProject,
    project,
    selectedObjectId,
    setStatus,
    tr
  ]);

  const bakeIK = useCallback((controlId: string) => {
    const control = ikSession.controls.find((entry) => entry.id === controlId);
    if (!control || !ikSession.characterId) {
      setStatus(tr("app.ikUnavailable"));
      return;
    }
    const result = bakeProjectRigIKControl(
      project,
      ikSession.characterId,
      control,
      project.animation.currentFrame
    );
    if (!result.changed || !result.historyLabel) {
      setStatus(result.error ?? tr("app.ikUnchanged"));
      return;
    }
    commitProject(result.project, result.historyLabel);
    setStatus(tr("app.ikBaked", { target: control.targetLabel, frame: project.animation.currentFrame }));
  }, [commitProject, ikSession.characterId, ikSession.controls, project, setStatus, tr]);

  const bakeFootLock = useCallback((
    controlId: string,
    startFrame: number,
    endFrame: number,
    groundOffset: number
  ) => {
    const control = ikSession.controls.find((entry) => entry.id === controlId);
    if (!control || !ikSession.characterId ||
      (control.limb !== "leftLeg" && control.limb !== "rightLeg")) {
      setStatus(tr("app.footLockUnavailable"));
      return;
    }
    const result = bakeProjectFootLockRange(project, ikSession.characterId, {
      limb: control.limb,
      startFrame,
      endFrame,
      groundOffset
    });
    if (!result.changed || !result.historyLabel) {
      setStatus(result.error ?? tr("app.footLockUnchanged"));
      return;
    }
    commitProject(result.project, result.historyLabel);
    setStatus(tr("app.footLockBaked", {
      target: control.targetLabel,
      start: result.anchor!.startFrame,
      end: result.anchor!.endFrame
    }));
  }, [commitProject, ikSession.characterId, ikSession.controls, project, setStatus, tr]);

  const bakeLookAt = useCallback(() => {
    if (!lookAtSession.control) {
      setStatus(tr("app.lookAtUnavailable"));
      return;
    }
    const result = bakeProjectLookAt(
      project,
      lookAtSession.control,
      project.animation.currentFrame
    );
    if (!result.changed || !result.historyLabel) {
      setStatus(result.error ?? tr("app.lookAtUnchanged"));
      return;
    }
    commitProject(result.project, result.historyLabel);
    setStatus(tr("app.lookAtBaked", {
      target: lookAtSession.control.subject.kind,
      frame: project.animation.currentFrame
    }));
  }, [commitProject, lookAtSession.control, project, setStatus, tr]);

  return {
    updateBoneRotation,
    addBoneKeyframe,
    resetPose,
    mirrorPose,
    saveCurrentPose,
    changeRigPreset,
    applyPose,
    applyAnimation,
    generateProceduralAnimation,
    bakeIK,
    bakeFootLock,
    bakeLookAt,
    attachmentWorkspace,
    poseWorkspace: {
      hasClipboard: poseClipboard !== null,
      applyPose,
      saveCurrentPose,
      copyPose,
      pastePose,
      blendPose,
      mirrorPose,
      resetPose
    } satisfies RigPoseWorkspace
  };
}

function poseCommandError(
  error: string | null,
  project: MineMotionProject,
  characterId: string,
  tr: RigWorkspaceControllerOptions["tr"]
): string {
  if (error === "POSE_CLIPBOARD_EMPTY") return tr("app.poseClipboardEmpty");
  if (error === "POSE_CHARACTER_LOCKED") {
    const name = project.scene.characters.find(
      (character) => character.id === characterId
    )?.name ?? characterId;
    return tr("app.entityLocked", { name });
  }
  if (error === "POSE_CHARACTER_MISSING") return tr("app.poseUnavailable");
  return tr("app.poseUnchanged");
}
