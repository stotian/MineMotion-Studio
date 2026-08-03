import type { SceneEntity, Vector3Tuple } from "../../project/ProjectFile";

export interface SubjectFrame {
  center: Vector3Tuple;
  width: number;
  height: number;
}

export function addVector(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function subtractVector(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scaleVector(value: Vector3Tuple, scale: number): Vector3Tuple {
  return [value[0] * scale, value[1] * scale, value[2] * scale];
}

export function vectorLength(value: Vector3Tuple): number {
  return Math.hypot(value[0], value[1], value[2]);
}

export function normalizeVector(value: Vector3Tuple): Vector3Tuple {
  const length = vectorLength(value);
  return length > 1e-6 ? scaleVector(value, 1 / length) : [0, 0, -1];
}

export function rotateAroundY(value: Vector3Tuple, degrees: number): Vector3Tuple {
  const radians = degrees * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [
    value[0] * cos - value[2] * sin,
    value[1],
    value[0] * sin + value[2] * cos
  ];
}

export function lookAtRotation(
  cameraPosition: Vector3Tuple,
  target: Vector3Tuple,
  roll = 0
): Vector3Tuple {
  const direction = subtractVector(target, cameraPosition);
  const horizontal = Math.hypot(direction[0], direction[2]);
  const pitch = Math.atan2(direction[1], Math.max(1e-6, horizontal)) * 180 / Math.PI;
  const yaw = Math.atan2(-direction[0], -direction[2]) * 180 / Math.PI;
  return [pitch, yaw, roll];
}

export function calculateSubjectFrame(subjects: SceneEntity[]): SubjectFrame {
  if (subjects.length === 0) {
    return { center: [0, 1.55, 0], width: 1, height: 1.9 };
  }
  const positions = subjects.map((subject) => subject.transform.position);
  const minX = Math.min(...positions.map((position) => position[0]));
  const maxX = Math.max(...positions.map((position) => position[0]));
  const minY = Math.min(...positions.map((position) => position[1]));
  const maxY = Math.max(...positions.map((position) => position[1]));
  const minZ = Math.min(...positions.map((position) => position[2]));
  const maxZ = Math.max(...positions.map((position) => position[2]));
  const characterCount = subjects.filter((subject) => subject.type === "character").length;
  const eyeOffset = characterCount > 0 ? 1.45 : 0.5;
  return {
    center: [
      (minX + maxX) / 2,
      (minY + maxY) / 2 + eyeOffset,
      (minZ + maxZ) / 2
    ],
    width: Math.max(1, Math.hypot(maxX - minX, maxZ - minZ) + 0.8),
    height: Math.max(1.9, maxY - minY + 1.9)
  };
}

export function cameraPositionFromOrbit(
  target: Vector3Tuple,
  distance: number,
  yawDegrees: number,
  heightOffset = 0
): Vector3Tuple {
  const radians = yawDegrees * Math.PI / 180;
  return [
    target[0] + Math.sin(radians) * distance,
    target[1] + heightOffset,
    target[2] + Math.cos(radians) * distance
  ];
}

export function midpoint(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}

export function horizontalDirection(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  const direction = normalizeVector([b[0] - a[0], 0, b[2] - a[2]]);
  return vectorLength(direction) < 1e-6 ? [0, 0, -1] : direction;
}
