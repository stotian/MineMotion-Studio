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

  it("clamps settings before allocation and normalizes unused controls", () => {
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
    expect(generateProceduralAnimation(safe).ok).toBe(true);
    expect(sanitizeProceduralAnimationSettings({
      ...createDefaultProceduralAnimationSettings("jump"),
      cycles: 8,
      direction: -1
    })).toMatchObject({ cycles: 1, direction: 1 });
  });

  it("generates closed direction-aware walk, run, and crouch locomotion", () => {
    const outputs = ["walk", "run", "crouch"].map((kind) =>
      generateProceduralAnimation({
        ...createDefaultProceduralAnimationSettings(
          kind as "walk" | "run" | "crouch"
        ),
        durationFrames: 32,
        cycles: 1
      })
    );
    expect(outputs.every((result) => result.ok)).toBe(true);
    for (const output of outputs) {
      for (const track of output.clip!.tracks) {
        expect(track.keyframes[0].value).toEqual(
          track.keyframes.at(-1)?.value
        );
      }
    }
    const walkArm = outputs[0].clip!.tracks.find(
      (track) => track.property === "bone.rotation.leftArm"
    )!;
    const runArm = outputs[1].clip!.tracks.find(
      (track) => track.property === "bone.rotation.leftArm"
    )!;
    expect(Math.max(...runArm.keyframes.map((key) => Math.abs(key.value[0]))))
      .toBeGreaterThan(
        Math.max(...walkArm.keyframes.map((key) => Math.abs(key.value[0])))
      );
    const crouchBody = outputs[2].clip!.tracks.find(
      (track) => track.property === "bone.rotation.body"
    )!;
    expect(crouchBody.keyframes[0].value[0]).toBe(24);

    const reverse = generateProceduralAnimation({
      ...createDefaultProceduralAnimationSettings("walk"),
      durationFrames: 32,
      cycles: 1,
      direction: -1
    });
    expect(reverse.clip!.tracks.find(
      (track) => track.property === "bone.rotation.leftArm"
    )?.keyframes[1].value[0]).toBe(-walkArm.keyframes[1].value[0]);
  });

  it("generates all six bounded action recipes with directional turns", () => {
    const kinds = [
      "jump",
      "landing",
      "recoil",
      "hitReaction",
      "swordSwing",
      "turn"
    ] as const;
    const outputs = kinds.map((kind) =>
      generateProceduralAnimation(
        createDefaultProceduralAnimationSettings(kind)
      )
    );
    expect(outputs.every((result) => result.ok)).toBe(true);
    for (const output of outputs) {
      expect(output.clip!.tracks.length).toBeGreaterThan(0);
      expect(output.clip!.tracks.every((track) =>
        track.keyframes.length <=
          PROCEDURAL_ANIMATION_LIMITS.maximumKeyframes &&
        track.keyframes[0].frame === 0 &&
        track.keyframes.at(-1)?.frame === output.clip!.durationFrames &&
        track.keyframes.every((keyframe) =>
          keyframe.value.every((component) =>
            Number.isFinite(component) && Math.abs(component) <= 180
          )
        )
      )).toBe(true);
    }
    const forward = outputs.at(-1)!.clip!.tracks.find(
      (track) => track.property === "bone.rotation.root"
    )!.keyframes.at(-1)!.value[1];
    const reverse = generateProceduralAnimation({
      ...createDefaultProceduralAnimationSettings("turn"),
      direction: -1
    }).clip!.tracks.find(
      (track) => track.property === "bone.rotation.root"
    )!.keyframes.at(-1)!.value[1];
    expect([forward, reverse]).toEqual([90, -90]);
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
