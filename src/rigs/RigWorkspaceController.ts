import { useCallback } from "react";
import type { TranslationKey, TranslationValues } from "../localization/LocalizationTypes";
import { presetRegistry } from "../presets/PresetRegistry";
import { applyRigPosePreset } from "../presets/RigPosePresets";
import { syncCinematicTimeline } from "../project/CinematicTimeline";
import type { MineMotionProject } from "../project/ProjectFile";
import { addBoneRotationKeyframe, updateProjectBoneRotation } from "./RigController";
import { getDefaultBoneRotations } from "./RigDefinition";
import { mirrorCurrentPose, resetRigPose, savePoseFromCharacter } from "./RigInstance";
import { getRigDefinition } from "./MinecraftRigPresets";
import { getSelectedCharacterId } from "./RigSelection";
import type { RigPresetId } from "./RigTypes";
import { bakeProjectFootLockRange } from "./IK/FootLockBakeController";
import { bakeProjectRigIKControl } from "./IK/RigIKController";
import type { RigIKSession } from "./IK/useRigIKSession";
import { bakeProjectLookAt } from "./constraints/LookAtController";
import type { LookAtSession } from "./constraints/useLookAtSession";
import {
  bakeProceduralAnimation,
  type ProceduralAnimationSettings
} from "./procedural/ProceduralAnimationController";

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

export function useRigWorkspaceController({
  project,
  selectedObjectId,
  ikSession,
  lookAtSession,
  commitProject,
  setStatus,
  tr
}: RigWorkspaceControllerOptions) {
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
    commitProject((current) => ({
      ...current,
      scene: {
        ...current.scene,
        characters: current.scene.characters.map((character) =>
          character.id === characterId ? resetRigPose(character) : character
        )
      }
    }), "Reset rig pose");
    setStatus(tr("app.poseReset"));
  }, [commitProject, setStatus, tr]);

  const mirrorPose = useCallback((characterId: string) => {
    commitProject((current) => ({
      ...current,
      scene: {
        ...current.scene,
        characters: current.scene.characters.map((character) =>
          character.id === characterId ? mirrorCurrentPose(character) : character
        )
      }
    }), "Mirror rig pose");
    setStatus(tr("app.poseMirrored"));
  }, [commitProject, setStatus, tr]);

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
    commitProject((current) => ({
      ...current,
      scene: {
        ...current.scene,
        characters: current.scene.characters.map((character) =>
          character.id === characterId ? applyRigPosePreset(character, preset) : character
        )
      }
    }), "Apply rig pose preset");
    setStatus(tr("app.poseApplied", { name: preset.name }));
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
    bakeLookAt
  };
}
