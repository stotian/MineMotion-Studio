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
    if (!candidate || typeof candidate !== "object") return [];
    const control = candidate as Partial<RigIKControl>;
    if (!LIMBS.has(control.limb as MinecraftLimbId) || limbs.has(control.limb as MinecraftLimbId)) return [];
    if (!ID_PATTERN.test(control.upperBoneId ?? "") || !ID_PATTERN.test(control.lowerBoneId ?? "") || control.upperBoneId === control.lowerBoneId) return [];
    const limb = control.limb as MinecraftLimbId;
    limbs.add(limb);
    return [{
      id: `ik:${limb}`,
      limb,
      upperBoneId: control.upperBoneId!,
      lowerBoneId: control.lowerBoneId!,
      targetLabel: TARGET_LABELS[limb],
      targetPosition: sanitizeCoordinate(control.targetPosition),
      poleDirection: nonZeroDirection(control.poleDirection),
      enabled: control.enabled === true,
      influence: Math.min(1, Math.max(0, Number.isFinite(control.influence) ? control.influence! : 1))
    }];
  });
}

function sanitizeCoordinate(value: unknown): RigVector3Tuple {
  return sanitizeRigVector(value).map((component) =>
    Math.min(RIG_IK_CONTROL_LIMITS.coordinate, Math.max(-RIG_IK_CONTROL_LIMITS.coordinate, component))
  ) as RigVector3Tuple;
}

function nonZeroDirection(value: unknown): RigVector3Tuple {
  const direction = sanitizeCoordinate(value);
  return Math.hypot(...direction) < 1e-6 ? [0, 0, 1] : direction;
}
