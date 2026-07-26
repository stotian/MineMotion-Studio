import { describe, expect, it } from "vitest";
import type { AnimationTrack } from "../../project/ProjectFile";
import {
  applyAnimationClip,
  createAnimationClip,
  isAnimationClipCompatible,
  parseAnimationClip,
  serializeAnimationClip
} from "./ClipSystem";
import {
  addClipToAnimationLayer,
  addClipToNla,
  ensureNlaLayer,
  updateNlaClip,
  updateNlaLayer
} from "./NlaTracks";

const track: AnimationTrack = {
  id: "hero:bone.rotation.rightArm",
  targetId: "hero",
  property: "bone.rotation.rightArm",
  keyframes: [
    { id: "a", frame: 20, value: [0, 0, 0], interpolation: "linear" },
    { id: "b", frame: 30, value: [-80, 0, 0], interpolation: "ease-out" }
  ]
};

describe("ClipSystem", () => {
  it("creates, serializes and reapplies a reusable clip", () => {
    const clip = createAnimationClip(
      "Sword Swing",
      [track],
      [
        { trackId: track.id, keyframeId: "a" },
        { trackId: track.id, keyframeId: "b" }
      ],
      "character"
    );
    expect(clip).not.toBeNull();
    const parsed = parseAnimationClip(serializeAnimationClip(clip!));
    const applied = applyAnimationClip([], parsed, "alex", 100);

    expect(parsed.durationFrames).toBe(10);
    expect(applied[0].targetId).toBe("alex");
    expect(applied[0].keyframes.map((keyframe) => keyframe.frame)).toEqual([100, 110]);
    expect(isAnimationClipCompatible(parsed, "character")).toBe(true);
    expect(isAnimationClipCompatible(parsed, "camera")).toBe(false);
  });

  it("creates and edits an NLA clip instance", () => {
    const clip = createAnimationClip(
      "Swing",
      [track],
      [{ trackId: track.id, keyframeId: "a" }],
      "character"
    )!;
    const nla = addClipToNla([], clip, "hero", 50);
    const muted = updateNlaClip(nla, nla[0].clips[0].id, { muted: true, weight: 2 });

    expect(muted[0].clips[0].muted).toBe(true);
    expect(muted[0].clips[0].weight).toBe(1);
    const hostile = updateNlaClip(muted, muted[0].clips[0].id, {
      startFrame: Number.NaN,
      durationFrames: Number.POSITIVE_INFINITY,
      timeScale: Number.NaN,
      weight: Number.NaN
    });
    expect(hostile[0].clips[0]).toMatchObject({
      startFrame: 50,
      durationFrames: 1,
      timeScale: 1,
      weight: 1
    });
  });

  it("keeps one bounded layer of each kind per target", () => {
    const clip = createAnimationClip(
      "Swing",
      [track],
      [{ trackId: track.id, keyframeId: "a" }],
      "character"
    )!;
    const layered = addClipToAnimationLayer(
      [],
      clip,
      "hero",
      12,
      "handAdjustment"
    );
    const withVfx = ensureNlaLayer(layered, "hero", "vfxSync");
    const unchanged = ensureNlaLayer(withVfx, "hero", "vfxSync");
    const updated = updateNlaLayer(unchanged, unchanged[1].id, {
      weight: Number.POSITIVE_INFINITY,
      muted: true,
      vfxEffectIds: ["effect_1", "effect_1", "effect_2"]
    });

    expect(unchanged).toBe(withVfx);
    expect(updated).toMatchObject([
      {
        layerKind: "handAdjustment",
        blendMode: "override",
        clips: [{ startFrame: 12 }]
      },
      {
        layerKind: "vfxSync",
        blendMode: "metadata",
        weight: 1,
        muted: true,
        vfxEffectIds: ["effect_1", "effect_2"]
      }
    ]);
  });
});
