import type { RigVector3Tuple } from "./RigTypes";

export const ZERO_ROTATION: RigVector3Tuple = [0, 0, 0];

export function cloneRotation(rotation: RigVector3Tuple | undefined): RigVector3Tuple {
  return rotation ? [rotation[0], rotation[1], rotation[2]] : [...ZERO_ROTATION];
}

export function normalizeRotation(rotation: Partial<RigVector3Tuple> | undefined): RigVector3Tuple {
  if (!rotation) return [...ZERO_ROTATION];
  return [
    Number.isFinite(rotation[0]) ? Number(rotation[0]) : 0,
    Number.isFinite(rotation[1]) ? Number(rotation[1]) : 0,
    Number.isFinite(rotation[2]) ? Number(rotation[2]) : 0
  ];
}

export function mirrorRotation(rotation: RigVector3Tuple): RigVector3Tuple {
  return [rotation[0], -rotation[1], -rotation[2]];
}

export function mergeBoneRotations(
  base: Record<string, RigVector3Tuple>,
  patch: Record<string, RigVector3Tuple>
): Record<string, RigVector3Tuple> {
  const next: Record<string, RigVector3Tuple> = {};
  for (const [boneId, rotation] of Object.entries(base)) {
    next[boneId] = cloneRotation(rotation);
  }
  for (const [boneId, rotation] of Object.entries(patch)) {
    next[boneId] = cloneRotation(rotation);
  }
  return next;
}
