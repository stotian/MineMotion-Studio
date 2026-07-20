import { describe, expect, it } from "vitest";
import { createRigIKControl, sanitizeRigIKControls } from "./IKControl";

describe("rig IK controls", () => {
  it("creates deterministic hand and foot targets outside project state", () => {
    expect(createRigIKControl("rightArm", "rightUpperArm", "rightForearm", [1, 2, 3])).toEqual({
      id: "ik:rightArm",
      limb: "rightArm",
      upperBoneId: "rightUpperArm",
      lowerBoneId: "rightForearm",
      targetLabel: "Right Hand",
      targetPosition: [1, 2, 3],
      poleDirection: [0, 0, 1],
      enabled: false,
      influence: 1
    });
    expect(createRigIKControl("leftLeg", "leftUpperLeg", "leftLowerLeg", [0, 0, 0]).targetLabel).toBe("Left Foot");
  });

  it("bounds coordinates/influence and rejects duplicate or malformed limbs", () => {
    expect(sanitizeRigIKControls([
      { limb: "rightArm", upperBoneId: "upper", lowerBoneId: "lower", targetPosition: [20_000, 2, 3], poleDirection: [0, 0, 0], enabled: true, influence: 4 },
      { limb: "rightArm", upperBoneId: "other", lowerBoneId: "lower", targetPosition: [0, 0, 0] },
      { limb: "tail", upperBoneId: "tail", lowerBoneId: "tip" }
    ])).toEqual([{
      id: "ik:rightArm",
      limb: "rightArm",
      upperBoneId: "upper",
      lowerBoneId: "lower",
      targetLabel: "Right Hand",
      targetPosition: [10_000, 2, 3],
      poleDirection: [0, 0, 1],
      enabled: true,
      influence: 1
    }]);
  });

  it("rejects sparse vectors, inherited records, and accessors without invoking them", () => {
    let accessed = false;
    const accessor = Object.defineProperty({}, "limb", {
      enumerable: true,
      get() { accessed = true; return "leftArm"; }
    });
    const inherited = Object.create({ limb: "leftArm" });
    Object.assign(inherited, { upperBoneId: "upper", lowerBoneId: "lower" });
    const sparse = { limb: "leftArm", upperBoneId: "upper", lowerBoneId: "lower", targetPosition: [1, , 3] };
    expect(sanitizeRigIKControls([accessor, inherited])).toEqual([]);
    expect(accessed).toBe(false);
    expect(sanitizeRigIKControls([sparse])[0].targetPosition).toEqual([0, 0, 0]);
  });
});
