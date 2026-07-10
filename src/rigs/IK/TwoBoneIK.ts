import type { IKChain } from "./IKChain";
import type { IKTarget, IKSolveResult } from "./IKTypes";

export function solveTwoBoneIK(chain: IKChain, target: IKTarget): IKSolveResult {
  if (chain.joints.length < 2) {
    return {
      solved: false,
      rotations: {},
      warnings: ["Two-bone IK requires at least two joints."]
    };
  }

  return {
    solved: false,
    rotations: {},
    warnings: [
      `IK target ${target.label} is registered; solver math is reserved for the next rig pass.`
    ]
  };
}
