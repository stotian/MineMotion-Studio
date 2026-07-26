import { Animator } from "../../animation/Animator";
import type {
  MineMotionProject,
  TransformData
} from "../../project/ProjectFile";
import { getRigDefinition } from "../MinecraftRigPresets";
import {
  addRigVectors,
  cloneRigTransform,
  inverseRigQuaternion,
  inverseTransformRigPoint,
  isFiniteRigVector,
  isValidRigTransform,
  multiplyRigQuaternions,
  quaternionFromRigEulerDegrees,
  rotateRigVector,
  subtractRigVectors,
  transformRigPoint
} from "../RigSpaceMath";
import type { RigVector3Tuple } from "../RigTypes";
import type { IKChain } from "./IKChain";
import type { RigIKControl } from "./IKControl";

export interface FootKinematicsSample {
  frame: number;
  characterId: string;
  worldPosition: RigVector3Tuple;
  chainRootWorldPosition: RigVector3Tuple;
  characterTransform: TransformData;
  parentRotation: RigVector3Tuple;
  parentOffset: RigVector3Tuple;
  chainRootOffset: RigVector3Tuple;
}

export type FootKinematicsResult =
  | { ok: true; sample: FootKinematicsSample; error: null }
  | { ok: false; sample: null; error: string };

export function sampleFootKinematics(
  project: MineMotionProject,
  characterId: string,
  control: RigIKControl,
  chain: IKChain,
  frame: number
): FootKinematicsResult {
  if (!Number.isInteger(frame) || frame < 0 || frame > project.animation.durationFrames) {
    return failure("FOOT_LOCK_FRAME_INVALID: Sample frame is outside the project range.");
  }
  if (control.limb !== "leftLeg" && control.limb !== "rightLeg") {
    return failure("FOOT_LOCK_LIMB_INVALID: Foot kinematics require a leg IK control.");
  }
  if (chain.joints.length !== 2 ||
    chain.joints[0].boneId !== control.upperBoneId ||
    chain.joints[1].boneId !== control.lowerBoneId) {
    return failure("FOOT_LOCK_CHAIN_MISMATCH: Foot control and chain IDs do not match.");
  }

  const sampledProject = Animator.sampleProject(project, frame);
  const character = sampledProject.scene.characters.find((entry) => entry.id === characterId);
  if (!character) return failure("FOOT_LOCK_CHARACTER_MISSING: The target character does not exist.");
  const definition = getRigDefinition(character.rigPreset);
  const upperBone = definition.bones.find((bone) => bone.id === control.upperBoneId);
  const parentBone = upperBone?.parentId
    ? definition.bones.find((bone) => bone.id === upperBone.parentId)
    : null;
  if (!upperBone || !parentBone || parentBone.parentId !== null) {
    return failure("FOOT_LOCK_HIERARCHY_UNSUPPORTED: The leg chain must be parented directly to the rig root.");
  }
  if (!isValidRigTransform(character.transform)) {
    return failure("FOOT_LOCK_TRANSFORM_INVALID: Character transform must be finite with non-zero scale.");
  }
  const parentRotation: RigVector3Tuple = isFiniteRigVector(character.boneRotations[parentBone.id])
    ? [...character.boneRotations[parentBone.id]] as RigVector3Tuple
    : [0, 0, 0];
  const upperRotation: RigVector3Tuple = isFiniteRigVector(character.boneRotations[control.upperBoneId])
    ? character.boneRotations[control.upperBoneId]
    : [0, 0, 0];
  const lowerRotation: RigVector3Tuple = isFiniteRigVector(character.boneRotations[control.lowerBoneId])
    ? character.boneRotations[control.lowerBoneId]
    : [0, 0, 0];
  const parentQuaternion = quaternionFromRigEulerDegrees(parentRotation);
  const upperQuaternion = quaternionFromRigEulerDegrees(upperRotation);
  const lowerQuaternion = multiplyRigQuaternions(
    upperQuaternion,
    quaternionFromRigEulerDegrees(lowerRotation)
  );
  const endInParent = addRigVectors(
    upperBone.offset,
    addRigVectors(
      rotateRigVector([0, -chain.joints[0].length, 0], upperQuaternion),
      rotateRigVector([0, -chain.joints[1].length, 0], lowerQuaternion)
    )
  );
  const parentOffset = [...parentBone.offset] as RigVector3Tuple;
  const chainRootOffset = [...upperBone.offset] as RigVector3Tuple;
  const endInCharacter = addRigVectors(parentOffset, rotateRigVector(endInParent, parentQuaternion));
  const chainRootInCharacter = addRigVectors(
    parentOffset,
    rotateRigVector(chainRootOffset, parentQuaternion)
  );
  return {
    ok: true,
    sample: {
      frame,
      characterId,
      worldPosition: transformRigPoint(endInCharacter, character.transform),
      chainRootWorldPosition: transformRigPoint(chainRootInCharacter, character.transform),
      characterTransform: cloneRigTransform(character.transform),
      parentRotation,
      parentOffset,
      chainRootOffset
    },
    error: null
  };
}

export function worldTargetToFootIKPosition(
  sample: FootKinematicsSample,
  worldPosition: RigVector3Tuple
): RigVector3Tuple | null {
  if (!isFiniteRigVector(worldPosition) || !isValidRigTransform(sample.characterTransform)) return null;
  const characterPosition = inverseTransformRigPoint(worldPosition, sample.characterTransform);
  const inParent = rotateRigVector(
    subtractRigVectors(characterPosition, sample.parentOffset),
    inverseRigQuaternion(quaternionFromRigEulerDegrees(sample.parentRotation))
  );
  const target = subtractRigVectors(inParent, sample.chainRootOffset);
  return isFiniteRigVector(target) ? target : null;
}

function failure(error: string): FootKinematicsResult {
  return { ok: false, sample: null, error };
}
