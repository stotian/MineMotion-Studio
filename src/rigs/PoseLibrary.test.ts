import { describe, expect, it } from "vitest";
import { createCharacter } from "../project/ProjectStore";
import { applyPoseToCharacter, BUILTIN_RIG_POSES } from "./PoseLibrary";
import { mirrorCurrentPose } from "./RigInstance";

describe("PoseLibrary", () => {
  it("contains the requested Phase 5 built-in poses", () => {
    expect(BUILTIN_RIG_POSES.map((pose) => pose.id)).toEqual(
      expect.arrayContaining([
        "idle",
        "walk-a",
        "walk-b",
        "run-a",
        "run-b",
        "jump",
        "land",
        "attack-windup",
        "attack-swing",
        "block-defend",
        "look-left",
        "look-right",
        "sitting",
        "crouch",
        "fear-back-away",
        "hero-pose"
      ])
    );
  });

  it("applies real bone rotations", () => {
    const character = createCharacter();
    const updated = applyPoseToCharacter(character, "attack-swing");

    expect(updated.boneRotations.rightArm).toEqual([-36, -18, -46]);
  });

  it("mirrors left and right limb rotations", () => {
    const character = {
      ...createCharacter(),
      boneRotations: {
        ...createCharacter().boneRotations,
        leftArm: [10, 20, 30] as [number, number, number],
        rightArm: [-10, -5, 15] as [number, number, number]
      }
    };

    const mirrored = mirrorCurrentPose(character);

    expect(mirrored.boneRotations.leftArm).toEqual([-10, 5, -15]);
    expect(mirrored.boneRotations.rightArm).toEqual([10, -20, -30]);
  });
});
