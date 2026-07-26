import type { RigVector3Tuple } from "../RigTypes";

export type LookAtEulerOrder = "XYZ" | "YXZ";

export interface LookAtConstraintInput {
  sourcePosition: RigVector3Tuple;
  targetPosition: RigVector3Tuple;
  currentRotation: RigVector3Tuple;
  eulerOrder?: LookAtEulerOrder;
  upDirection?: RigVector3Tuple;
  minRotation?: RigVector3Tuple;
  maxRotation?: RigVector3Tuple;
  influence?: number;
}

export interface LookAtSolveResult {
  solved: boolean;
  rotation: RigVector3Tuple | null;
  idealRotation: RigVector3Tuple | null;
  requestedDirection: RigVector3Tuple | null;
  evaluatedDirection: RigVector3Tuple | null;
  reachedTarget: boolean;
  clamped: boolean;
  warnings: string[];
}

type Quaternion = [number, number, number, number];

const EPSILON = 1e-7;
const COORDINATE_LIMIT = 30_000_000;

export function solveLookAtConstraint(input: unknown): LookAtSolveResult {
  const record = ownDataRecord(input);
  if (!record) return failure("LOOK_AT_INPUT_INVALID: Constraint input must be a plain data record.");
  const sourcePosition = safeVector(record.sourcePosition, COORDINATE_LIMIT);
  const targetPosition = safeVector(record.targetPosition, COORDINATE_LIMIT);
  const currentRotation = safeVector(record.currentRotation, 360_000);
  if (!sourcePosition || !targetPosition || !currentRotation) {
    return failure("LOOK_AT_VECTOR_INVALID: Positions and current rotation must contain three finite bounded numbers.");
  }
  const requested = subtract(targetPosition, sourcePosition);
  if (length(requested) < EPSILON) {
    return failure("LOOK_AT_TARGET_DEGENERATE: Source and target positions must differ.");
  }
  const eulerOrder = record.eulerOrder === "YXZ" ? "YXZ" : "XYZ";
  const upDirection = record.upDirection === undefined
    ? [0, 1, 0] as RigVector3Tuple
    : safeVector(record.upDirection, COORDINATE_LIMIT);
  if (!upDirection || length(upDirection) < EPSILON) {
    return failure("LOOK_AT_UP_INVALID: Up direction must be a finite non-zero vector.");
  }
  const minimum = record.minRotation === undefined
    ? [-180, -180, -180] as RigVector3Tuple
    : safeVector(record.minRotation, 360_000);
  const maximum = record.maxRotation === undefined
    ? [180, 180, 180] as RigVector3Tuple
    : safeVector(record.maxRotation, 360_000);
  if (!minimum || !maximum || minimum.some((value, index) => value > maximum[index])) {
    return failure("LOOK_AT_LIMIT_INVALID: Minimum rotations must not exceed maximum rotations.");
  }

  const warnings: string[] = [];
  const direction = normalize(requested);
  let up = normalize(upDirection);
  if (length(cross(direction, up)) < EPSILON) {
    up = Math.abs(direction[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    warnings.push("LOOK_AT_UP_COLLINEAR: A deterministic up direction fallback was used.");
  }
  const desiredQuaternion = lookQuaternion(direction, up);
  const idealRotation = eulerDegrees(desiredQuaternion, eulerOrder);
  const rawInfluence = typeof record.influence === "number" && Number.isFinite(record.influence)
    ? record.influence
    : 1;
  const influence = clamp(rawInfluence, 0, 1);
  if (influence !== rawInfluence) {
    warnings.push("LOOK_AT_INFLUENCE_CLAMPED: Influence was clamped to the supported range.");
  }
  const currentQuaternion = quaternionFromEulerDegrees(currentRotation, eulerOrder);
  const influencedQuaternion = slerpQuaternion(currentQuaternion, desiredQuaternion, influence);
  const influencedRotation = eulerDegrees(influencedQuaternion, eulerOrder);
  const rotation = influencedRotation.map((component, index) =>
    clamp(component, minimum[index], maximum[index])
  ) as RigVector3Tuple;
  const clamped = rotation.some((component, index) =>
    Math.abs(component - influencedRotation[index]) > EPSILON
  );
  if (clamped) warnings.push("LOOK_AT_LIMIT_CLAMPED: One or more rotation components reached their limit.");
  const evaluatedDirection = normalize(rotateVector(
    [0, 0, -1],
    quaternionFromEulerDegrees(rotation, eulerOrder)
  ));
  return {
    solved: true,
    rotation,
    idealRotation,
    requestedDirection: direction,
    evaluatedDirection,
    reachedTarget: dot(direction, evaluatedDirection) > 1 - 1e-8,
    clamped,
    warnings
  };
}

function failure(warning: string): LookAtSolveResult {
  return {
    solved: false,
    rotation: null,
    idealRotation: null,
    requestedDirection: null,
    evaluatedDirection: null,
    reachedTarget: false,
    clamped: false,
    warnings: [warning]
  };
}

function lookQuaternion(direction: RigVector3Tuple, up: RigVector3Tuple): Quaternion {
  const right = normalize(cross(direction, up));
  const correctedUp = normalize(cross(right, direction));
  const back = scale(direction, -1);
  return quaternionFromRotationMatrix([
    right[0], correctedUp[0], back[0],
    right[1], correctedUp[1], back[1],
    right[2], correctedUp[2], back[2]
  ]);
}

function quaternionFromRotationMatrix(matrix: readonly number[]): Quaternion {
  const [m11, m12, m13, m21, m22, m23, m31, m32, m33] = matrix;
  const trace = m11 + m22 + m33;
  let quaternion: Quaternion;
  if (trace > 0) {
    const size = 0.5 / Math.sqrt(trace + 1);
    quaternion = [(m32 - m23) * size, (m13 - m31) * size, (m21 - m12) * size, 0.25 / size];
  } else if (m11 > m22 && m11 > m33) {
    const size = 2 * Math.sqrt(1 + m11 - m22 - m33);
    quaternion = [0.25 * size, (m12 + m21) / size, (m13 + m31) / size, (m32 - m23) / size];
  } else if (m22 > m33) {
    const size = 2 * Math.sqrt(1 + m22 - m11 - m33);
    quaternion = [(m12 + m21) / size, 0.25 * size, (m23 + m32) / size, (m13 - m31) / size];
  } else {
    const size = 2 * Math.sqrt(1 + m33 - m11 - m22);
    quaternion = [(m13 + m31) / size, (m23 + m32) / size, 0.25 * size, (m21 - m12) / size];
  }
  return normalizeQuaternion(quaternion);
}

function quaternionFromEulerDegrees(
  rotation: RigVector3Tuple,
  order: LookAtEulerOrder
): Quaternion {
  const [x, y, z] = rotation.map((value) => value * Math.PI / 180);
  const c1 = Math.cos(x / 2);
  const c2 = Math.cos(y / 2);
  const c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2);
  const s2 = Math.sin(y / 2);
  const s3 = Math.sin(z / 2);
  return normalizeQuaternion(order === "XYZ" ? [
    s1 * c2 * c3 + c1 * s2 * s3,
    c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 + s1 * s2 * c3,
    c1 * c2 * c3 - s1 * s2 * s3
  ] : [
    s1 * c2 * c3 + c1 * s2 * s3,
    c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 - s1 * s2 * c3,
    c1 * c2 * c3 + s1 * s2 * s3
  ]);
}

function eulerDegrees(quaternion: Quaternion, order: LookAtEulerOrder): RigVector3Tuple {
  const [x, y, z, w] = quaternion;
  const m11 = 1 - 2 * (y * y + z * z);
  const m12 = 2 * (x * y - z * w);
  const m13 = 2 * (x * z + y * w);
  const m21 = 2 * (x * y + z * w);
  const m22 = 1 - 2 * (x * x + z * z);
  const m23 = 2 * (y * z - x * w);
  const m31 = 2 * (x * z - y * w);
  const m32 = 2 * (y * z + x * w);
  const m33 = 1 - 2 * (x * x + y * y);
  let radians: RigVector3Tuple;
  if (order === "XYZ") {
    const ry = Math.asin(clamp(m13, -1, 1));
    radians = Math.abs(m13) < 0.9999999
      ? [Math.atan2(-m23, m33), ry, Math.atan2(-m12, m11)]
      : [Math.atan2(m32, m22), ry, 0];
  } else {
    const rx = Math.asin(-clamp(m23, -1, 1));
    radians = Math.abs(m23) < 0.9999999
      ? [rx, Math.atan2(m13, m33), Math.atan2(m21, m22)]
      : [rx, Math.atan2(-m31, m11), 0];
  }
  return radians.map((value) => {
    const degrees = value * 180 / Math.PI;
    return degrees === 0 ? 0 : degrees;
  }) as RigVector3Tuple;
}

function slerpQuaternion(from: Quaternion, to: Quaternion, amount: number): Quaternion {
  const start = normalizeQuaternion(from);
  let target = normalizeQuaternion(to);
  let cosine = dotQuaternion(start, target);
  if (cosine < 0) {
    target = target.map((value) => -value) as Quaternion;
    cosine = -cosine;
  }
  if (cosine > 0.9995) {
    return normalizeQuaternion(start.map((value, index) =>
      value + amount * (target[index] - value)
    ) as Quaternion);
  }
  const angle = Math.acos(clamp(cosine, -1, 1));
  const sine = Math.sin(angle);
  const startWeight = Math.sin((1 - amount) * angle) / sine;
  const targetWeight = Math.sin(amount * angle) / sine;
  return normalizeQuaternion(start.map((value, index) =>
    value * startWeight + target[index] * targetWeight
  ) as Quaternion);
}

function rotateVector(vector: RigVector3Tuple, quaternion: Quaternion): RigVector3Tuple {
  const axis: RigVector3Tuple = [quaternion[0], quaternion[1], quaternion[2]];
  const uv = cross(axis, vector);
  const uuv = cross(axis, uv);
  return add(vector, add(scale(uv, 2 * quaternion[3]), scale(uuv, 2)));
}

function ownDataRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.values(descriptors).some((descriptor) => !("value" in descriptor))) return null;
    return Object.fromEntries(Object.entries(descriptors).map(([key, descriptor]) => [key, descriptor.value]));
  } catch {
    return null;
  }
}

function safeVector(value: unknown, limit: number): RigVector3Tuple | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  try {
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const output = [0, 1, 2].map((index) => descriptors[index.toString()]);
    if (output.some((descriptor) => !descriptor || !("value" in descriptor) ||
      typeof descriptor.value !== "number" || !Number.isFinite(descriptor.value) ||
      Math.abs(descriptor.value) > limit)) return null;
    return output.map((descriptor) => descriptor!.value as number) as RigVector3Tuple;
  } catch {
    return null;
  }
}

function normalize(vector: RigVector3Tuple): RigVector3Tuple {
  const size = length(vector);
  return size < EPSILON ? [0, 0, 0] : scale(vector, 1 / size);
}

function normalizeQuaternion(quaternion: Quaternion): Quaternion {
  const size = Math.hypot(...quaternion);
  return size < EPSILON
    ? [0, 0, 0, 1]
    : quaternion.map((value) => value / size) as Quaternion;
}

function add(left: RigVector3Tuple, right: RigVector3Tuple): RigVector3Tuple {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
}

function subtract(left: RigVector3Tuple, right: RigVector3Tuple): RigVector3Tuple {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
}

function scale(vector: RigVector3Tuple, amount: number): RigVector3Tuple {
  return [vector[0] * amount, vector[1] * amount, vector[2] * amount];
}

function cross(left: RigVector3Tuple, right: RigVector3Tuple): RigVector3Tuple {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0]
  ];
}

function dot(left: RigVector3Tuple, right: RigVector3Tuple): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function dotQuaternion(left: Quaternion, right: Quaternion): number {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

function length(vector: RigVector3Tuple): number {
  return Math.hypot(...vector);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
