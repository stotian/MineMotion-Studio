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
}
