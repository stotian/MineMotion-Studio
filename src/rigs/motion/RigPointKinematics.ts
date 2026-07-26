import type { TransformData } from "../../project/ProjectFile";
import type { RigDefinition } from "../RigDefinition";
import {
  addRigVectors,
  isFiniteRigVector,
  isValidRigTransform,
  quaternionFromRigEulerDegrees,
  rotateRigVector,
  transformRigPoint
} from "../RigSpaceMath";
import type { RigVector3Tuple } from "../RigTypes";

export interface RigPointPose {
  transform: TransformData;
  boneRotations: Readonly<Record<string, RigVector3Tuple>>;
}

export type RigPointKinematicsResult =
  | { ok: true; worldPosition: RigVector3Tuple; error: null }
  | { ok: false; worldPosition: null; error: string };

const MAX_BONE_DEPTH = 32;

export function evaluateRigPointWorld(
  definition: RigDefinition,
  pose: RigPointPose,
  boneId: string,
  pointInBone: RigVector3Tuple
): RigPointKinematicsResult {
  if (!isValidRigTransform(pose.transform) || !isFiniteRigVector(pointInBone)) {
    return failure("MOTION_PATH_RIG_INPUT_INVALID: Rig transform and local point must be finite.");
  }
  const boneById = new Map(definition.bones.map((bone) => [bone.id, bone]));
  const chain = [];
  const visited = new Set<string>();
  let bone = boneById.get(boneId);
  while (bone) {
    if (visited.has(bone.id) || chain.length >= MAX_BONE_DEPTH) {
      return failure("MOTION_PATH_RIG_CYCLE: Bone hierarchy is cyclic or too deep.");
    }
    visited.add(bone.id);
    chain.push(bone);
    bone = bone.parentId ? boneById.get(bone.parentId) : undefined;
    if (chain.at(-1)?.parentId && !bone) {
      return failure("MOTION_PATH_RIG_PARENT_MISSING: Bone hierarchy has a missing parent.");
    }
  }
  if (chain.length === 0) {
    return failure("MOTION_PATH_RIG_BONE_MISSING: The requested rig bone does not exist.");
  }

  let point = [...pointInBone] as RigVector3Tuple;
  for (const entry of chain) {
    const rotation = isFiniteRigVector(pose.boneRotations[entry.id])
      ? pose.boneRotations[entry.id]
      : [0, 0, 0] as RigVector3Tuple;
    point = addRigVectors(
      entry.offset,
      rotateRigVector(point, quaternionFromRigEulerDegrees(rotation))
    );
  }
  const worldPosition = transformRigPoint(point, pose.transform);
  return isFiniteRigVector(worldPosition)
    ? { ok: true, worldPosition, error: null }
    : failure("MOTION_PATH_RIG_RESULT_INVALID: Rig evaluation produced a non-finite point.");
}

function failure(error: string): RigPointKinematicsResult {
  return { ok: false, worldPosition: null, error };
}
