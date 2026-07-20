import { describe, expect, it } from "vitest";
import { createInitialProject } from "../../project/ProjectStore";
import { createIKChain } from "./IKChain";
import { bakeRigIKControl } from "./IKBakeController";
import { createRigIKControl } from "./IKControl";

describe("IK bake controller", () => {
  it("writes both solved bones through the authoritative timeline", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.boneRotations.rightForearm = [0, 0, 0];
    const control = {
      ...createRigIKControl("rightArm", "rightArm", "rightForearm", [0.8, -1.2, 0.2]),
      enabled: true
    };
    const chain = createIKChain("right-arm", "Right Arm", "rightArm", "rightHand", [
      { boneId: "rightArm", length: 0.6 },
      { boneId: "rightForearm", length: 0.6 }
    ]);
    const result = bakeRigIKControl(project, character.id, control, chain, 18);
    expect(result.ok).toBe(true);
    expect(result.project.animation.tracks.map((track) => track.property)).toEqual([
      "bone.rotation.rightArm",
      "bone.rotation.rightForearm"
    ]);
    expect(result.project.animation.tracks.every((track) => track.keyframes[0].frame === 18)).toBe(true);
    expect(result.project.scene.characters[0].boneKeyframes).toHaveLength(2);
    expect(project.animation.tracks).toEqual([]);
  });

  it("does not mutate the project for disabled, mismatched, or missing controls", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    const control = createRigIKControl("rightArm", "rightArm", "rightForearm", [0, -1, 0]);
    const chain = createIKChain("right-arm", "Right Arm", "rightArm", "rightHand", [
      { boneId: "rightArm", length: 0.6 },
      { boneId: "rightForearm", length: 0.6 }
    ]);
    expect(bakeRigIKControl(project, character.id, control, chain)).toMatchObject({ ok: false, changed: false, project });
    expect(bakeRigIKControl(project, "missing", { ...control, enabled: true }, chain).error).toContain("IK_CHARACTER_MISSING");
  });
});
