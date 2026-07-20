import type { IKChain } from "./IKChain";
import type { IKTarget, IKSolveResult, TwoBoneIKOptions } from "./IKTypes";
import type { RigVector3Tuple } from "../RigTypes";

const EPSILON = 1e-6;

type Quaternion = [number, number, number, number];

export function solveTwoBoneIK(
  chain: IKChain,
  target: IKTarget,
  options: TwoBoneIKOptions = {}
): IKSolveResult {
  if (chain.joints.length !== 2) {
    return {
      solved: false,
      rotations: {},
      warnings: ["IK_CHAIN_JOINT_COUNT: Two-bone IK requires exactly two joints."]
    };
  }
  const [upper, lower] = chain.joints;
  if (!finitePositive(upper.length) || !finitePositive(lower.length)) {
    return { solved: false, rotations: {}, warnings: ["IK_CHAIN_LENGTH_INVALID: Joint lengths must be finite and positive."] };
  }
  const root: RigVector3Tuple = finiteVector(options.rootPosition)
    ? [...options.rootPosition]
    : [0, 0, 0];
  if (!finiteVector(target.position)) {
    return { solved: false, rotations: {}, warnings: ["IK_TARGET_INVALID: Target position must contain three finite numbers."] };
  }
  const toTarget = subtract(target.position, root);
  const requestedDistance = length(toTarget);
  if (requestedDistance < EPSILON) {
    return { solved: false, rotations: {}, warnings: ["IK_TARGET_DEGENERATE: Target cannot coincide with the chain root."] };
  }
  const minimumDistance = Math.abs(upper.length - lower.length) + EPSILON;
  const maximumDistance = upper.length + lower.length - EPSILON;
  const solvedDistance = clamp(requestedDistance, minimumDistance, maximumDistance);
  const clamped = Math.abs(solvedDistance - requestedDistance) > EPSILON;
  const direction = scale(toTarget, 1 / requestedDistance);
  const pole: RigVector3Tuple = finiteVector(options.poleDirection) && length(options.poleDirection) > EPSILON
    ? normalize(options.poleDirection)
    : [0, 0, 1] as RigVector3Tuple;
  let planeNormal = cross(direction, pole);
  const warnings: string[] = [];
  if (length(planeNormal) < EPSILON) {
    const fallback = Math.abs(direction[0]) < 0.9 ? [1, 0, 0] as RigVector3Tuple : [0, 0, 1] as RigVector3Tuple;
    planeNormal = cross(direction, fallback);
    warnings.push("IK_POLE_COLLINEAR: A deterministic perpendicular pole fallback was used.");
  }
  planeNormal = normalize(planeNormal);
  let bendDirection = normalize(cross(planeNormal, direction));
  if (dot(bendDirection, pole) < 0) bendDirection = scale(bendDirection, -1);
  const along = (upper.length ** 2 + solvedDistance ** 2 - lower.length ** 2) / (2 * solvedDistance);
  const height = Math.sqrt(Math.max(0, upper.length ** 2 - along ** 2));
  const jointPosition = add(root, add(scale(direction, along), scale(bendDirection, height)));
  const endPosition = add(root, scale(direction, solvedDistance));
  const upperDirection = normalize(subtract(jointPosition, root));
  const lowerDirection = normalize(subtract(endPosition, jointPosition));
  const upperWorld = fromToQuaternion([0, -1, 0], upperDirection);
  const lowerWorld = fromToQuaternion([0, -1, 0], lowerDirection);
  const lowerLocal = multiplyQuaternion(inverseQuaternion(upperWorld), lowerWorld);
  const influence = clamp(Number.isFinite(options.influence) ? options.influence! : 1, 0, 1);
  let upperRotation = scale(eulerDegrees(upperWorld), influence);
  let lowerRotation = scale(eulerDegrees(lowerLocal), influence);
  const limitedUpper = clampRotation(upperRotation, upper.minRotation, upper.maxRotation);
  const limitedLower = clampRotation(lowerRotation, lower.minRotation, lower.maxRotation);
  if (!sameVector(upperRotation, limitedUpper) || !sameVector(lowerRotation, limitedLower)) {
    warnings.push("IK_JOINT_LIMIT: One or more joint rotation components were clamped.");
  }
  upperRotation = limitedUpper;
  lowerRotation = limitedLower;
  if (clamped) warnings.push(requestedDistance > maximumDistance
    ? "IK_TARGET_TOO_FAR: Target was clamped to maximum reach."
    : "IK_TARGET_TOO_CLOSE: Target was clamped to minimum reach.");
  return {
    solved: true,
    rotations: { [upper.boneId]: upperRotation, [lower.boneId]: lowerRotation },
    warnings,
    reachedTarget: !clamped && influence === 1 && warnings.every((warning) => !warning.startsWith("IK_JOINT_LIMIT")),
    clamped,
    jointPosition,
    endPosition
  };
}

function finitePositive(value: number): boolean { return Number.isFinite(value) && value > EPSILON; }
function finiteVector(value: unknown): value is RigVector3Tuple { return Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === "number" && Number.isFinite(item)); }
function add(a: RigVector3Tuple, b: RigVector3Tuple): RigVector3Tuple { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function subtract(a: RigVector3Tuple, b: RigVector3Tuple): RigVector3Tuple { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function scale(a: RigVector3Tuple, value: number): RigVector3Tuple { return [a[0] * value, a[1] * value, a[2] * value]; }
function dot(a: RigVector3Tuple, b: RigVector3Tuple): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a: RigVector3Tuple, b: RigVector3Tuple): RigVector3Tuple { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function length(a: RigVector3Tuple): number { return Math.hypot(a[0], a[1], a[2]); }
function normalize(a: RigVector3Tuple): RigVector3Tuple { const size = length(a); return size < EPSILON ? [0, 0, 0] : scale(a, 1 / size); }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, value)); }
function sameVector(a: RigVector3Tuple, b: RigVector3Tuple): boolean { return a.every((value, index) => Math.abs(value - b[index]) < EPSILON); }
function clampRotation(value: RigVector3Tuple, minimum?: RigVector3Tuple, maximum?: RigVector3Tuple): RigVector3Tuple {
  return value.map((component, index) => clamp(component, minimum?.[index] ?? -Infinity, maximum?.[index] ?? Infinity)) as RigVector3Tuple;
}
function fromToQuaternion(from: RigVector3Tuple, to: RigVector3Tuple): Quaternion {
  const axis = cross(from, to);
  const w = 1 + dot(from, to);
  if (w < EPSILON) return [1, 0, 0, 0];
  const size = Math.hypot(axis[0], axis[1], axis[2], w);
  return [axis[0] / size, axis[1] / size, axis[2] / size, w / size];
}
function inverseQuaternion(q: Quaternion): Quaternion { return [-q[0], -q[1], -q[2], q[3]]; }
function multiplyQuaternion(a: Quaternion, b: Quaternion): Quaternion {
  return [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
}
function eulerDegrees([x, y, z, w]: Quaternion): RigVector3Tuple {
  const radians: RigVector3Tuple = [
    Math.atan2(2 * (x * w - y * z), w * w - x * x - y * y + z * z),
    Math.asin(clamp(2 * (x * z + y * w), -1, 1)),
    Math.atan2(2 * (z * w - x * y), w * w + x * x - y * y - z * z)
  ];
  return radians.map((value) => value * 180 / Math.PI) as RigVector3Tuple;
}
