import type { RigVector3Tuple } from "../RigTypes";
import { sanitizeRigVector } from "../RigContract";

export type MinecraftLimbId = "leftArm" | "rightArm" | "leftLeg" | "rightLeg";

export interface RigIKControl {
  id: string;
  limb: MinecraftLimbId;
  upperBoneId: string;
  lowerBoneId: string;
  targetLabel: "Left Hand" | "Right Hand" | "Left Foot" | "Right Foot";
  targetPosition: RigVector3Tuple;
  poleDirection: RigVector3Tuple;
  enabled: boolean;
  influence: number;
}

export const RIG_IK_CONTROL_LIMITS = Object.freeze({ controls: 4, coordinate: 10_000 });

const LIMBS = new Set<MinecraftLimbId>(["leftArm", "rightArm", "leftLeg", "rightLeg"]);
const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

const TARGET_LABELS: Readonly<Record<MinecraftLimbId, RigIKControl["targetLabel"]>> = Object.freeze({
  leftArm: "Left Hand",
  rightArm: "Right Hand",
  leftLeg: "Left Foot",
  rightLeg: "Right Foot"
});

export function createRigIKControl(
  limb: MinecraftLimbId,
  upperBoneId: string,
  lowerBoneId: string,
  targetPosition: RigVector3Tuple
): RigIKControl {
  return {
    id: `ik:${limb}`,
    limb,
    upperBoneId,
    lowerBoneId,
    targetLabel: TARGET_LABELS[limb],
    targetPosition: sanitizeCoordinate(targetPosition),
    poleDirection: limb.endsWith("Arm") ? [0, 0, 1] : [0, 0, -1],
    enabled: false,
    influence: 1
  };
}

export function sanitizeRigIKControls(value: unknown): RigIKControl[] {
  if (!Array.isArray(value)) return [];
  const limbs = new Set<MinecraftLimbId>();
  return value.slice(0, RIG_IK_CONTROL_LIMITS.controls).flatMap((candidate) => {
    const control = ownDataRecord(candidate);
    if (!control) return [];
    if (!LIMBS.has(control.limb as MinecraftLimbId) || limbs.has(control.limb as MinecraftLimbId)) return [];
    if (typeof control.upperBoneId !== "string" || typeof control.lowerBoneId !== "string" ||
      !ID_PATTERN.test(control.upperBoneId) || !ID_PATTERN.test(control.lowerBoneId) || control.upperBoneId === control.lowerBoneId) return [];
    const limb = control.limb as MinecraftLimbId;
    limbs.add(limb);
    return [{
      id: `ik:${limb}`,
      limb,
      upperBoneId: control.upperBoneId,
      lowerBoneId: control.lowerBoneId,
      targetLabel: TARGET_LABELS[limb],
      targetPosition: sanitizeCoordinate(control.targetPosition),
      poleDirection: nonZeroDirection(control.poleDirection),
      enabled: control.enabled === true,
      influence: Math.min(1, Math.max(0, typeof control.influence === "number" && Number.isFinite(control.influence) ? control.influence : 1))
    }];
  });
}

function sanitizeCoordinate(value: unknown): RigVector3Tuple {
  const vector = safeVector(value) ?? [0, 0, 0];
  return vector.map((component) =>
    Math.min(RIG_IK_CONTROL_LIMITS.coordinate, Math.max(-RIG_IK_CONTROL_LIMITS.coordinate, component))
  ) as RigVector3Tuple;
}

function nonZeroDirection(value: unknown): RigVector3Tuple {
  const direction = sanitizeCoordinate(value);
  return Math.hypot(...direction) < 1e-6 ? [0, 0, 1] : direction;
}

function safeVector(value: unknown): RigVector3Tuple | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const components = [0, 1, 2].map((index) => descriptors[index.toString()]);
  if (components.some((descriptor) => !descriptor || !("value" in descriptor) ||
    typeof descriptor.value !== "number" || !Number.isFinite(descriptor.value))) return null;
  return sanitizeRigVector(value);
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
