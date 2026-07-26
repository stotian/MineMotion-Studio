import type { TransformData } from "../project/ProjectFile";
import type { RigVector3Tuple } from "./RigTypes";

export type RigQuaternion = [number, number, number, number];

const EPSILON = 1e-9;

export function isFiniteRigVector(value: unknown): value is RigVector3Tuple {
  return Array.isArray(value) &&
    value.length === 3 &&
    value.every((component) =>
      typeof component === "number" && Number.isFinite(component)
    );
}

export function isValidRigTransform(transform: TransformData): boolean {
  return isFiniteRigVector(transform.position) &&
    isFiniteRigVector(transform.rotation) &&
    isFiniteRigVector(transform.scale) &&
    transform.scale.every((component) => Math.abs(component) > 1e-6);
}

export function cloneRigTransform(transform: TransformData): TransformData {
  return {
    position: [...transform.position],
    rotation: [...transform.rotation],
    scale: [...transform.scale]
  };
}

export function addRigVectors(
  left: RigVector3Tuple,
  right: RigVector3Tuple
): RigVector3Tuple {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
}

export function subtractRigVectors(
  left: RigVector3Tuple,
  right: RigVector3Tuple
): RigVector3Tuple {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}

export function quaternionFromRigEulerDegrees(
  rotation: RigVector3Tuple
): RigQuaternion {
  const [x, y, z] = rotation.map((value) => value * Math.PI / 180);
  const c1 = Math.cos(x / 2);
  const c2 = Math.cos(y / 2);
  const c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2);
  const s2 = Math.sin(y / 2);
  const s3 = Math.sin(z / 2);
  return normalizeRigQuaternion([
    s1 * c2 * c3 + c1 * s2 * s3,
    c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 + s1 * s2 * c3,
    c1 * c2 * c3 - s1 * s2 * s3
  ]);
}

export function multiplyRigQuaternions(
  left: RigQuaternion,
  right: RigQuaternion
): RigQuaternion {
  return normalizeRigQuaternion([
    left[3] * right[0] + left[0] * right[3] + left[1] * right[2] - left[2] * right[1],
    left[3] * right[1] - left[0] * right[2] + left[1] * right[3] + left[2] * right[0],
    left[3] * right[2] + left[0] * right[1] - left[1] * right[0] + left[2] * right[3],
    left[3] * right[3] - left[0] * right[0] - left[1] * right[1] - left[2] * right[2]
  ]);
}

export function inverseRigQuaternion(
  quaternion: RigQuaternion
): RigQuaternion {
  return [-quaternion[0], -quaternion[1], -quaternion[2], quaternion[3]];
}

export function rotateRigVector(
  vector: RigVector3Tuple,
  quaternion: RigQuaternion
): RigVector3Tuple {
  const axis: RigVector3Tuple = [quaternion[0], quaternion[1], quaternion[2]];
  const uv = crossRigVectors(axis, vector);
  const uuv = crossRigVectors(axis, uv);
  return addRigVectors(
    vector,
    addRigVectors(
      uv.map((value) => value * 2 * quaternion[3]) as RigVector3Tuple,
      uuv.map((value) => value * 2) as RigVector3Tuple
    )
  );
}

export function transformRigPoint(
  point: RigVector3Tuple,
  transform: TransformData
): RigVector3Tuple {
  const scaled: RigVector3Tuple = [
    point[0] * transform.scale[0],
    point[1] * transform.scale[1],
    point[2] * transform.scale[2]
  ];
  return addRigVectors(
    transform.position,
    rotateRigVector(scaled, quaternionFromRigEulerDegrees(transform.rotation))
  );
}

export function inverseTransformRigPoint(
  point: RigVector3Tuple,
  transform: TransformData
): RigVector3Tuple {
  const unrotated = rotateRigVector(
    subtractRigVectors(point, transform.position),
    inverseRigQuaternion(quaternionFromRigEulerDegrees(transform.rotation))
  );
  return [
    unrotated[0] / transform.scale[0],
    unrotated[1] / transform.scale[1],
    unrotated[2] / transform.scale[2]
  ];
}

function crossRigVectors(
  left: RigVector3Tuple,
  right: RigVector3Tuple
): RigVector3Tuple {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0]
  ];
}

function normalizeRigQuaternion(
  quaternion: RigQuaternion
): RigQuaternion {
  const size = Math.hypot(...quaternion);
  return size < EPSILON
    ? [0, 0, 0, 1]
    : quaternion.map((value) => value / size) as RigQuaternion;
}
