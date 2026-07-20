import type { RigVector3Tuple } from "./RigTypes";

export interface RigBone {
  id: string;
  label: string;
  parentId: string | null;
  size: RigVector3Tuple;
  pivot: RigVector3Tuple;
  offset: RigVector3Tuple;
  skinPart?:
    | "head"
    | "body"
    | "leftArm"
    | "rightArm"
    | "leftLeg"
    | "rightLeg"
    | "cape";
  skinSegment?: "upper" | "lower";
  mirrorOf?: string;
  selectable?: boolean;
}

export const CORE_BONE_IDS = [
  "root",
  "body",
  "head",
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg"
] as const;
