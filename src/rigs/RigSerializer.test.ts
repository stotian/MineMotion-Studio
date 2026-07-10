import { describe, expect, it } from "vitest";
import { createCharacter, createInitialProject } from "../project/ProjectStore";
import { addBoneRotationKeyframe } from "./RigController";
import { sanitizeCharacterRig } from "./RigSerializer";

describe("RigSerializer", () => {
  it("migrates default_steve to the Steve rig preset", () => {
    const legacy = {
      ...createCharacter(),
      rigPreset: "default_steve" as const,
      boneRotations: {
        head: [0, 25, 0] as [number, number, number]
      }
    };

    const sanitized = sanitizeCharacterRig(legacy);

    expect(sanitized.rigPreset).toBe("steve");
    expect(sanitized.boneRotations.head).toEqual([0, 25, 0]);
    expect(sanitized.boneRotations.leftArm).toEqual([0, 0, -8]);
    expect(sanitized.attachments?.length).toBeGreaterThan(0);
  });

  it("serializes bone keyframes on the character and global timeline", () => {
    const project = {
      ...createTestProject(),
      animation: {
        ...createTestProject().animation,
        currentFrame: 12
      }
    };
    const character = project.scene.characters[0];

    const updated = addBoneRotationKeyframe(project, character.id, "head", 12);

    expect(updated.animation.tracks[0].property).toBe("bone.rotation.head");
    expect(updated.scene.characters[0].boneKeyframes?.[0].keyframes[0].frame).toBe(12);
  });
});

function createTestProject() {
  return createInitialProject();
}
