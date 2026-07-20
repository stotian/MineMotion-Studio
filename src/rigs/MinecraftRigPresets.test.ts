import { describe, expect, it } from "vitest";
import { getRigDefinition } from "./MinecraftRigPresets";

describe("Minecraft player limb segmentation", () => {
  it.each(["steve", "alex"] as const)("provides four physical two-bone chains for %s", (preset) => {
    const definition = getRigDefinition(preset);
    for (const [upperId, lowerId] of [
      ["leftArm", "leftForearm"],
      ["rightArm", "rightForearm"],
      ["leftLeg", "leftLowerLeg"],
      ["rightLeg", "rightLowerLeg"]
    ]) {
      const upper = definition.bones.find((bone) => bone.id === upperId)!;
      const lower = definition.bones.find((bone) => bone.id === lowerId)!;
      expect(upper.size[1]).toBe(0.6);
      expect(upper.pivot).toEqual([0, -0.3, 0]);
      expect(upper.skinSegment).toBe("upper");
      expect(lower.parentId).toBe(upperId);
      expect(lower.offset).toEqual([0, -0.6, 0]);
      expect(lower.skinSegment).toBe("lower");
    }
    expect(definition.attachmentPoints.find((point) => point.id === "rightHand")?.boneId)
      .toBe("rightForearm");
  });
});
