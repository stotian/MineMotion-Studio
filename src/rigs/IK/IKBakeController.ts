import type { MineMotionProject } from "../../project/ProjectFile";
import { addBoneRotationKeyframe, updateProjectBoneRotation } from "../RigController";
import type { IKChain } from "./IKChain";
import type { IKSolveResult } from "./IKTypes";
import type { RigIKControl } from "./IKControl";
import { solveTwoBoneIK } from "./TwoBoneIK";

export interface RigIKBakeResult {
  ok: boolean;
  changed: boolean;
  project: MineMotionProject;
  solve: IKSolveResult | null;
  error: string | null;
}

export function bakeRigIKControl(
  project: MineMotionProject,
  characterId: string,
  control: RigIKControl,
  chain: IKChain,
  frame = project.animation.currentFrame
): RigIKBakeResult {
  if (!control.enabled) return failure(project, "IK_CONTROL_DISABLED: Enable the IK control before baking.");
  const character = project.scene.characters.find((entry) => entry.id === characterId);
  if (!character) return failure(project, "IK_CHARACTER_MISSING: The target character does not exist.");
  if (chain.joints.length !== 2 || chain.joints[0].boneId !== control.upperBoneId || chain.joints[1].boneId !== control.lowerBoneId) {
    return failure(project, "IK_CONTROL_CHAIN_MISMATCH: Control bone IDs do not match the two-bone chain.");
  }
  if (!Object.hasOwn(character.boneRotations, control.upperBoneId) || !Object.hasOwn(character.boneRotations, control.lowerBoneId)) {
    return failure(project, "IK_CONTROL_BONE_MISSING: Both controlled bones must exist on the character rig.");
  }
  const solve = solveTwoBoneIK(chain, {
    id: control.id,
    label: control.targetLabel,
    position: control.targetPosition
  }, {
    poleDirection: control.poleDirection,
    influence: control.influence
  });
  if (!solve.solved) return { ...failure(project, solve.warnings[0] ?? "IK_SOLVE_FAILED: IK solve failed."), solve };
  if (
    hasRotation(character.boneRotations[control.upperBoneId], solve.rotations[control.upperBoneId]) &&
    hasRotation(character.boneRotations[control.lowerBoneId], solve.rotations[control.lowerBoneId]) &&
    hasGlobalKeyframe(project, characterId, control.upperBoneId, frame, solve.rotations[control.upperBoneId]) &&
    hasGlobalKeyframe(project, characterId, control.lowerBoneId, frame, solve.rotations[control.lowerBoneId])
  ) {
    return { ok: true, changed: false, project, solve, error: null };
  }
  let next = updateProjectBoneRotation(project, characterId, control.upperBoneId, solve.rotations[control.upperBoneId]);
  next = updateProjectBoneRotation(next, characterId, control.lowerBoneId, solve.rotations[control.lowerBoneId]);
  next = addBoneRotationKeyframe(next, characterId, control.upperBoneId, frame);
  next = addBoneRotationKeyframe(next, characterId, control.lowerBoneId, frame);
  return { ok: true, changed: true, project: next, solve, error: null };
}

function failure(project: MineMotionProject, error: string): RigIKBakeResult {
  return { ok: false, changed: false, project, solve: null, error };
}

function hasGlobalKeyframe(
  project: MineMotionProject,
  characterId: string,
  boneId: string,
  frame: number,
  rotation: readonly number[]
): boolean {
  return project.animation.tracks.some((track) =>
    track.targetId === characterId &&
    track.property === `bone.rotation.${boneId}` &&
    track.keyframes.some((keyframe) => keyframe.frame === frame && hasRotation(keyframe.value, rotation))
  );
}

function hasRotation(left: readonly number[] | undefined, right: readonly number[]): boolean {
  return Boolean(left) && left!.length === 3 && right.length === 3 &&
    left!.every((value, index) => Math.abs(value - right[index]) < 1e-9);
}
