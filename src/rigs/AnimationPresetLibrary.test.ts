import { describe, expect, it } from "vitest";
import { createInitialProject } from "../project/ProjectStore";
import {
  applyRigAnimationPreset,
  RIG_ANIMATION_PRESETS
} from "./AnimationPresetLibrary";

describe("AnimationPresetLibrary", () => {
  it("contains the requested rig animation clips", () => {
    expect(RIG_ANIMATION_PRESETS.map((clip) => clip.id)).toEqual(
      expect.arrayContaining([
        "idle-breathing",
        "walk-cycle",
        "run-cycle",
        "sword-swing",
        "hit-reaction",
        "camera-ready-turnaround",
        "head-look-around",
        "jump-land"
      ])
    );
  });

  it("generates bone rotation timeline tracks", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    const updated = applyRigAnimationPreset(project, character.id, "walk-cycle");

    expect(updated.animation.tracks.some((track) => track.property === "bone.rotation.leftArm")).toBe(true);
    expect(updated.animation.durationFrames).toBeGreaterThanOrEqual(32);
  });
});
