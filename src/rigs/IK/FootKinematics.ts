import { Animator } from "../../animation/Animator";
import type {
  MineMotionProject,
  TransformData,
  Vector3Tuple
} from "../../project/ProjectFile";
import { getRigDefinition } from "../MinecraftRigPresets";
import type { RigVector3Tuple } from "../RigTypes";
import type { IKChain } from "./IKChain";
import type { RigIKControl } from "./IKControl";

type Quaternion = [number, number, number, number];

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
  if (!validTransform(character.transform)) {
    return failure("FOOT_LOCK_TRANSFORM_INVALID: Character transform must be finite with non-zero scale.");
  }
  const parentRotation: RigVector3Tuple = finiteVector(character.boneRotations[parentBone.id])
    ? [...character.boneRotations[parentBone.id]] as RigVector3Tuple
    : [0, 0, 0];
  const upperRotation: RigVector3Tuple = finiteVector(character.boneRotations[control.upperBoneId])
    ? character.boneRotations[control.upperBoneId]
    : [0, 0, 0];
  const lowerRotation: RigVector3Tuple = finiteVector(character.boneRotations[control.lowerBoneId])
    ? character.boneRotations[control.lowerBoneId]
    : [0, 0, 0];
  const parentQuaternion = quaternionFromEulerDegrees(parentRotation);
  const upperQuaternion = quaternionFromEulerDegrees(upperRotation);
  const lowerQuaternion = multiplyQuaternion(
    upperQuaternion,
    quaternionFromEulerDegrees(lowerRotation)
  );
  const endInParent = add(
    upperBone.offset,
    add(
      rotateVector([0, -chain.joints[0].length, 0], upperQuaternion),
      rotateVector([0, -chain.joints[1].length, 0], lowerQuaternion)
    )
  );
  const parentOffset = [...parentBone.offset] as RigVector3Tuple;
  const chainRootOffset = [...upperBone.offset] as RigVector3Tuple;
  const endInCharacter = add(parentOffset, rotateVector(endInParent, parentQuaternion));
  const chainRootInCharacter = add(
    parentOffset,
    rotateVector(chainRootOffset, parentQuaternion)
  );
  return {
    ok: true,
    sample: {
      frame,
      characterId,
      worldPosition: transformPoint(endInCharacter, character.transform),
      chainRootWorldPosition: transformPoint(chainRootInCharacter, character.transform),
      characterTransform: cloneTransform(character.transform),
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
  if (!finiteVector(worldPosition) || !validTransform(sample.characterTransform)) return null;
  const characterPosition = inverseTransformPoint(worldPosition, sample.characterTransform);
  const inParent = rotateVector(
    subtract(characterPosition, sample.parentOffset),
    inverseQuaternion(quaternionFromEulerDegrees(sample.parentRotation))
  );
  const target = subtract(inParent, sample.chainRootOffset);
  return finiteVector(target) ? target : null;
}

function transformPoint(point: RigVector3Tuple, transform: TransformData): RigVector3Tuple {
  const scaled: RigVector3Tuple = [
    point[0] * transform.scale[0],
    point[1] * transform.scale[1],
    point[2] * transform.scale[2]
  ];
  return add(
    transform.position,
    rotateVector(scaled, quaternionFromEulerDegrees(transform.rotation))
  );
}

function inverseTransformPoint(point: RigVector3Tuple, transform: TransformData): RigVector3Tuple {
  const unrotated = rotateVector(
    subtract(point, transform.position),
    inverseQuaternion(quaternionFromEulerDegrees(transform.rotation))
  );
  return [
    unrotated[0] / transform.scale[0],
    unrotated[1] / transform.scale[1],
    unrotated[2] / transform.scale[2]
  ];
}

function cloneTransform(transform: TransformData): TransformData {
  return {
    position: [...transform.position],
    rotation: [...transform.rotation],
    scale: [...transform.scale]
  };
}

function validTransform(transform: TransformData): boolean {
  return finiteVector(transform.position) &&
    finiteVector(transform.rotation) &&
    finiteVector(transform.scale) &&
    transform.scale.every((component) => Math.abs(component) > 1e-6);
}

function failure(error: string): FootKinematicsResult {
  return { ok: false, sample: null, error };
}

function finiteVector(value: unknown): value is Vector3Tuple {
  return Array.isArray(value) &&
    value.length === 3 &&
    value.every((component) => typeof component === "number" && Number.isFinite(component));
}

function add(left: RigVector3Tuple, right: RigVector3Tuple): RigVector3Tuple {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
}

function subtract(left: RigVector3Tuple, right: RigVector3Tuple): RigVector3Tuple {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}

function cross(left: RigVector3Tuple, right: RigVector3Tuple): RigVector3Tuple {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0]
  ];
}

function quaternionFromEulerDegrees(rotation: RigVector3Tuple): Quaternion {
  const [x, y, z] = rotation.map((value) => value * Math.PI / 180);
  const c1 = Math.cos(x / 2);
  const c2 = Math.cos(y / 2);
  const c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2);
  const s2 = Math.sin(y / 2);
  const s3 = Math.sin(z / 2);
  return normalizeQuaternion([
    s1 * c2 * c3 + c1 * s2 * s3,
    c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 + s1 * s2 * c3,
    c1 * c2 * c3 - s1 * s2 * s3
  ]);
}

function multiplyQuaternion(left: Quaternion, right: Quaternion): Quaternion {
  return normalizeQuaternion([
    left[3] * right[0] + left[0] * right[3] + left[1] * right[2] - left[2] * right[1],
    left[3] * right[1] - left[0] * right[2] + left[1] * right[3] + left[2] * right[0],
    left[3] * right[2] + left[0] * right[1] - left[1] * right[0] + left[2] * right[3],
    left[3] * right[3] - left[0] * right[0] - left[1] * right[1] - left[2] * right[2]
  ]);
}

function inverseQuaternion(quaternion: Quaternion): Quaternion {
  return [-quaternion[0], -quaternion[1], -quaternion[2], quaternion[3]];
}

function normalizeQuaternion(quaternion: Quaternion): Quaternion {
  const size = Math.hypot(...quaternion);
  return size < 1e-9
    ? [0, 0, 0, 1]
    : quaternion.map((value) => value / size) as Quaternion;
}

function rotateVector(vector: RigVector3Tuple, quaternion: Quaternion): RigVector3Tuple {
  const axis: RigVector3Tuple = [quaternion[0], quaternion[1], quaternion[2]];
  const uv = cross(axis, vector);
  const uuv = cross(axis, uv);
  return add(
    vector,
    add(
      uv.map((value) => value * 2 * quaternion[3]) as RigVector3Tuple,
      uuv.map((value) => value * 2) as RigVector3Tuple
    )
  );
}
