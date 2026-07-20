import type { RigVector3Tuple } from "../RigTypes";

export interface IKTarget {
  id: string;
  label: string;
  position: RigVector3Tuple;
}

export interface IKJoint {
  boneId: string;
  length: number;
  minRotation?: RigVector3Tuple;
  maxRotation?: RigVector3Tuple;
}

export interface IKSolveResult {
  solved: boolean;
  rotations: Record<string, RigVector3Tuple>;
  warnings: string[];
  reachedTarget?: boolean;
  clamped?: boolean;
  jointPosition?: RigVector3Tuple;
  endPosition?: RigVector3Tuple;
}

export interface TwoBoneIKOptions {
  rootPosition?: RigVector3Tuple;
  poleDirection?: RigVector3Tuple;
  influence?: number;
}
