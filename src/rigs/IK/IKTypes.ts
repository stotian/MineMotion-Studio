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
  /** Analytic positions before influence and component joint limits. */
  idealJointPosition?: RigVector3Tuple;
  idealEndPosition?: RigVector3Tuple;
  /** Forward-kinematic positions reconstructed from the returned rotations. */
  evaluatedJointPosition?: RigVector3Tuple;
  evaluatedEndPosition?: RigVector3Tuple;
  /** @deprecated Use idealJointPosition. Retained for Phase 19.2 callers. */
  jointPosition?: RigVector3Tuple;
  /** @deprecated Use idealEndPosition. Retained for Phase 19.2 callers. */
  endPosition?: RigVector3Tuple;
}

export interface TwoBoneIKOptions {
  rootPosition?: RigVector3Tuple;
  poleDirection?: RigVector3Tuple;
  influence?: number;
}
