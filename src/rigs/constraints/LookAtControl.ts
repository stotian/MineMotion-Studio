import type { RigVector3Tuple } from "../RigTypes";

export type LookAtSubjectKind = "head" | "camera" | "object";

export interface LookAtSubject {
  kind: LookAtSubjectKind;
  id: string;
}

export interface LookAtControl {
  subject: LookAtSubject;
  targetId: string | null;
  targetPosition: RigVector3Tuple;
  enabled: boolean;
  influence: number;
  maxAngle: RigVector3Tuple;
}

export const LOOK_AT_CONTROL_LIMITS = Object.freeze({
  coordinate: 10_000,
  angle: 180,
  idLength: 128
});

const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const SUBJECT_KINDS = new Set<LookAtSubjectKind>(["head", "camera", "object"]);

export function createLookAtControl(
  subject: LookAtSubject,
  targetId: string | null
): LookAtControl {
  return {
    subject: { ...subject },
    targetId,
    targetPosition: [0, 2, 0],
    enabled: false,
    influence: 1,
    maxAngle: defaultMaxAngle(subject.kind)
  };
}

export function sanitizeLookAtControl(value: unknown): LookAtControl | null {
  const record = ownDataRecord(value);
  const subject = ownDataRecord(record?.subject);
  if (!record || !subject ||
    !SUBJECT_KINDS.has(subject.kind as LookAtSubjectKind) ||
    !safeId(subject.id)) {
    return null;
  }
  const targetId = record.targetId === null
    ? null
    : safeId(record.targetId)
      ? record.targetId
      : undefined;
  if (targetId === undefined) return null;
  const kind = subject.kind as LookAtSubjectKind;
  return {
    subject: { kind, id: subject.id },
    targetId,
    targetPosition: sanitizeVector(record.targetPosition, LOOK_AT_CONTROL_LIMITS.coordinate),
    enabled: record.enabled === true,
    influence: clampNumber(record.influence, 0, 1, 1),
    maxAngle: sanitizeVector(record.maxAngle, LOOK_AT_CONTROL_LIMITS.angle, defaultMaxAngle(kind))
      .map((component) => Math.abs(component)) as RigVector3Tuple
  };
}

function defaultMaxAngle(kind: LookAtSubjectKind): RigVector3Tuple {
  if (kind === "head") return [60, 85, 0];
  if (kind === "camera") return [89, 180, 0];
  return [180, 180, 180];
}

function sanitizeVector(
  value: unknown,
  limit: number,
  fallback: RigVector3Tuple = [0, 0, 0]
): RigVector3Tuple {
  const vector = safeVector(value);
  if (!vector) return [...fallback];
  return vector.map((component) =>
    Math.min(limit, Math.max(-limit, component))
  ) as RigVector3Tuple;
}

function safeVector(value: unknown): RigVector3Tuple | null {
  try {
    if (!Array.isArray(value) || value.length !== 3) return null;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const components = [0, 1, 2].map((index) => descriptors[index.toString()]);
    if (components.some((descriptor) => !descriptor || !("value" in descriptor) ||
      typeof descriptor.value !== "number" || !Number.isFinite(descriptor.value))) {
      return null;
    }
    return components.map((descriptor) => descriptor!.value as number) as RigVector3Tuple;
  } catch {
    return null;
  }
}

function safeId(value: unknown): value is string {
  return typeof value === "string" &&
    value.length <= LOOK_AT_CONTROL_LIMITS.idLength &&
    ID_PATTERN.test(value);
}

function clampNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

function ownDataRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.values(descriptors).some((descriptor) => !("value" in descriptor))) {
      return null;
    }
    return Object.fromEntries(
      Object.entries(descriptors).map(([key, descriptor]) => [key, descriptor.value])
    );
  } catch {
    return null;
  }
}
