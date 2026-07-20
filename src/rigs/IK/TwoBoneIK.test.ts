import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createIKChain } from "./IKChain";
import { solveTwoBoneIK } from "./TwoBoneIK";
import type { RigVector3Tuple } from "../RigTypes";

function chain(lengthA = 1, lengthB = 1) {
  return createIKChain("right-arm", "Right Arm", "rightArm", "rightHand", [
    { boneId: "rightArm", length: lengthA },
    { boneId: "rightForearm", length: lengthB }
  ]);
}

function distance(a: RigVector3Tuple, b: RigVector3Tuple): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

describe("solveTwoBoneIK", () => {
  it("solves a reachable target with exact segment lengths and deterministic output", () => {
    const target = { id: "hand", label: "Hand", position: [1, -1, 0] as RigVector3Tuple };
    const first = solveTwoBoneIK(chain(), target, { poleDirection: [0, 0, 1] });
    const second = solveTwoBoneIK(chain(), target, { poleDirection: [0, 0, 1] });
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
    expect(first.solved).toBe(true);
    expect(first.reachedTarget).toBe(true);
    expect(first.clamped).toBe(false);
    expect(first.endPosition).toEqual(target.position);
    expect(distance([0, 0, 0], first.jointPosition!)).toBeCloseTo(1, 8);
    expect(distance(first.jointPosition!, first.endPosition!)).toBeCloseTo(1, 8);
    expect(Object.values(first.rotations).flat().every(Number.isFinite)).toBe(true);
    const upperRotation = first.rotations.rightArm;
    const lowerRotation = first.rotations.rightForearm;
    const upperQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      ...upperRotation.map(THREE.MathUtils.degToRad) as RigVector3Tuple,
      "XYZ"
    ));
    const lowerLocalQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      ...lowerRotation.map(THREE.MathUtils.degToRad) as RigVector3Tuple,
      "XYZ"
    ));
    const solvedUpperDirection = new THREE.Vector3(0, -1, 0).applyQuaternion(upperQuaternion);
    const solvedLowerDirection = new THREE.Vector3(0, -1, 0).applyQuaternion(
      upperQuaternion.clone().multiply(lowerLocalQuaternion)
    );
    const expectedUpperDirection = new THREE.Vector3(...first.jointPosition!).normalize();
    const expectedLowerDirection = new THREE.Vector3(
      first.endPosition![0] - first.jointPosition![0],
      first.endPosition![1] - first.jointPosition![1],
      first.endPosition![2] - first.jointPosition![2]
    ).normalize();
    expect(solvedUpperDirection.distanceTo(expectedUpperDirection)).toBeLessThan(1e-6);
    expect(solvedLowerDirection.distanceTo(expectedLowerDirection)).toBeLessThan(1e-6);
  });

  it("clamps targets beyond maximum and minimum reach without non-finite output", () => {
    const far = solveTwoBoneIK(chain(), { id: "far", label: "Far", position: [0, -5, 0] });
    expect(far.solved).toBe(true);
    expect(far.reachedTarget).toBe(false);
    expect(far.clamped).toBe(true);
    expect(distance([0, 0, 0], far.endPosition!)).toBeCloseTo(2, 5);
    expect(far.warnings).toContain("IK_TARGET_TOO_FAR: Target was clamped to maximum reach.");

    const close = solveTwoBoneIK(chain(2, 1), { id: "close", label: "Close", position: [0, -0.1, 0] });
    expect(distance([0, 0, 0], close.endPosition!)).toBeCloseTo(1, 5);
    expect(close.warnings).toContain("IK_TARGET_TOO_CLOSE: Target was clamped to minimum reach.");
  });

  it("fails explicitly for malformed chains and degenerate targets", () => {
    expect(solveTwoBoneIK(createIKChain("bad", "Bad", "a", "b", [{ boneId: "a", length: 1 }]), {
      id: "target", label: "Target", position: [0, -1, 0]
    })).toMatchObject({ solved: false, warnings: [expect.stringContaining("IK_CHAIN_JOINT_COUNT")] });
    expect(solveTwoBoneIK(chain(0, 1), { id: "target", label: "Target", position: [0, -1, 0] }))
      .toMatchObject({ solved: false, warnings: [expect.stringContaining("IK_CHAIN_LENGTH_INVALID")] });
    expect(solveTwoBoneIK(chain(), { id: "root", label: "Root", position: [0, 0, 0] }))
      .toMatchObject({ solved: false, warnings: [expect.stringContaining("IK_TARGET_DEGENERATE")] });
  });

  it("uses a deterministic pole fallback and honors influence and joint limits", () => {
    const limited = chain();
    limited.joints[0].minRotation = [-10, -10, -10];
    limited.joints[0].maxRotation = [10, 10, 10];
    const result = solveTwoBoneIK(limited, { id: "hand", label: "Hand", position: [0.5, -1, 0] }, {
      poleDirection: [0.5, -1, 0],
      influence: 0.5
    });
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining("IK_POLE_COLLINEAR"),
      expect.stringContaining("IK_JOINT_LIMIT")
    ]));
    expect(result.rotations.rightArm.every((value) => value >= -10 && value <= 10)).toBe(true);
    expect(result.reachedTarget).toBe(false);
  });
});
