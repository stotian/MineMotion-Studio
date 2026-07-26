import { describe, expect, it } from "vitest";
import {
  createDefaultProceduralAnimationSettings,
  generateProceduralAnimation,
  PROCEDURAL_ANIMATION_LIMITS,
  sanitizeProceduralAnimationSettings
} from "./ProceduralAnimation";

describe("procedural animation generation", () => {
  it("generates a deterministic editable idle loop from bounded settings", () => {
    const settings = {
      ...createDefaultProceduralAnimationSettings("idle"),
      durationFrames: 64,
      intensity: 1.25,
      cycles: 2
    };
    const first = generateProceduralAnimation(settings);
    const second = generateProceduralAnimation(structuredClone(settings));

    expect(second).toEqual(first);
    expect(first.ok).toBe(true);
    expect(first.clip).toMatchObject({
      name: "Procedural Idle",
      targetType: "character",
      durationFrames: 64
    });
    expect(first.clip?.tracks.map((track) => track.property)).toEqual([
      "bone.rotation.body",
      "bone.rotation.head",
      "bone.rotation.leftArm",
      "bone.rotation.rightArm"
    ]);
    for (const track of first.clip!.tracks) {
      expect(track.keyframes[0].value).toEqual(
        track.keyframes.at(-1)?.value
      );
      expect(track.keyframes.every((keyframe) =>
        keyframe.interpolation === "ease-in-out"
      )).toBe(true);
    }
    expect(settings).toEqual({
      ...createDefaultProceduralAnimationSettings("idle"),
      durationFrames: 64,
      intensity: 1.25,
      cycles: 2
    });
  });

  it("clamps settings before allocation and reports unavailable generators", () => {
    const safe = sanitizeProceduralAnimationSettings({
      ...createDefaultProceduralAnimationSettings("walk"),
      durationFrames: Number.POSITIVE_INFINITY,
      intensity: 99,
      cycles: 99,
      direction: -1
    });
    expect(safe).toEqual({
      ...createDefaultProceduralAnimationSettings("walk"),
      intensity: PROCEDURAL_ANIMATION_LIMITS.maximumIntensity,
      cycles: PROCEDURAL_ANIMATION_LIMITS.maximumCycles,
      direction: -1
    });
    expect(generateProceduralAnimation(safe).error).toContain(
      "PROCEDURAL_ANIMATION_KIND_UNAVAILABLE"
    );
  });

  it("rejects accessor and invalid-version inputs without invoking them", () => {
    let accessed = false;
    const hostile = Object.defineProperty({}, "kind", {
      enumerable: true,
      get() {
        accessed = true;
        return "idle";
      }
    });
    expect(generateProceduralAnimation(hostile).error).toContain(
      "PROCEDURAL_ANIMATION_SETTINGS_INVALID"
    );
    expect(generateProceduralAnimation({
      ...createDefaultProceduralAnimationSettings(),
      version: 2
    }).ok).toBe(false);
    expect(accessed).toBe(false);
  });
});
