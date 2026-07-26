import { describe, expect, it } from "vitest";
import type {
  AnimatableProperty,
  ReusableAnimationClip,
  Vector3Tuple
} from "../../project/ProjectFile";
import {
  ANIMATION_LAYER_KINDS,
  createAnimationLayer,
  sanitizeAnimationLayers,
  type AnimationLayerData,
  type AnimationLayerKind
} from "./AnimationLayer";
import { evaluateAnimationLayers } from "./AnimationLayerEvaluator";

function clip(
  id: string,
  tracks: Array<{
    property: AnimatableProperty;
    values: Array<[number, Vector3Tuple]>;
  }>
): ReusableAnimationClip {
  return {
    id,
    name: id,
    description: "",
    targetType: "character",
    durationFrames: 10,
    tracks: tracks.map((track) => ({
      property: track.property,
      keyframes: track.values.map(([frame, value]) => ({ frame, value }))
    })),
    createdAt: "2026-01-01T00:00:00.000Z"
  };
}

function withClip(
  kind: AnimationLayerKind,
  clipId: string,
  patch: Partial<AnimationLayerData> = {}
): AnimationLayerData {
  const layer = createAnimationLayer("character_1", kind);
  return {
    ...layer,
    ...patch,
    clips: [{
      id: `instance_${kind}`,
      clipId,
      targetId: "character_1",
      startFrame: 0,
      durationFrames: 10,
      timeScale: 1,
      weight: 1,
      muted: false
    }]
  };
}

describe("animation layers", () => {
  it("sanitizes fixed ordered kinds, blend modes, weights, clips, and VFX references", () => {
    const layers = ANIMATION_LAYER_KINDS.map((kind) =>
      createAnimationLayer("character_1", kind)
    ).reverse();
    layers.find((layer) => layer.kind === "additiveMotion")!.blendMode = "override";
    layers.find((layer) => layer.kind === "upperBody")!.weight = 3;
    const vfx = layers.find((layer) => layer.kind === "vfxSync")!;
    vfx.vfxEffectIds = ["effect_1", "effect_1", "effect_2"];
    const safe = sanitizeAnimationLayers(layers);
    expect(safe.map((layer) => layer.kind)).toEqual(ANIMATION_LAYER_KINDS);
    expect(safe.find((layer) => layer.kind === "additiveMotion")?.blendMode)
      .toBe("additive");
    expect(safe.find((layer) => layer.kind === "vfxSync")?.blendMode)
      .toBe("metadata");
    expect(safe.find((layer) => layer.kind === "upperBody")?.weight).toBe(1);
    expect(safe.find((layer) => layer.kind === "vfxSync")?.vfxEffectIds)
      .toEqual(["effect_1", "effect_2"]);
    expect(safe.filter((layer) => layer.kind !== "vfxSync").every(
      (layer) => layer.vfxEffectIds.length === 0
    )).toBe(true);
  });

  it("applies override layers in fixed scope order", () => {
    const clips = [
      clip("base_clip", [
        { property: "transform.position", values: [[0, [10, 0, 0]]] },
        { property: "bone.rotation.head", values: [[0, [10, 0, 0]]] },
        { property: "bone.rotation.leftLeg", values: [[0, [20, 0, 0]]] }
      ]),
      clip("upper_clip", [
        { property: "bone.rotation.head", values: [[0, [30, 0, 0]]] },
        { property: "bone.rotation.leftLeg", values: [[0, [90, 0, 0]]] }
      ]),
      clip("head_clip", [
        { property: "bone.rotation.head", values: [[0, [60, 0, 0]]] }
      ]),
      clip("hand_clip", [
        { property: "bone.rotation.leftArm", values: [[0, [40, 0, 0]]] },
        { property: "bone.rotation.head", values: [[0, [100, 0, 0]]] }
      ])
    ];
    const layers = [
      withClip("handAdjustment", "hand_clip"),
      withClip("headLook", "head_clip", { weight: 0.5 }),
      withClip("upperBody", "upper_clip", { weight: 0.5 }),
      withClip("base", "base_clip")
    ];
    const result = evaluateAnimationLayers(layers, clips, {
      "transform.position": [0, 0, 0],
      "bone.rotation.head": [0, 0, 0],
      "bone.rotation.leftArm": [0, 0, 0],
      "bone.rotation.leftLeg": [0, 0, 0]
    }, 0);
    expect(result.values).toMatchObject({
      "transform.position": [10, 0, 0],
      "bone.rotation.head": [40, 0, 0],
      "bone.rotation.leftArm": [40, 0, 0],
      "bone.rotation.leftLeg": [20, 0, 0]
    });
    expect(result.activeLayerIds).toHaveLength(4);
  });

  it("adds motion relative to the clip start with combined layer and instance weight", () => {
    const additiveClip = clip("additive_clip", [{
      property: "transform.position",
      values: [
        [0, [5, 0, 0]],
        [10, [15, 4, 0]]
      ]
    }]);
    const layer = withClip("additiveMotion", additiveClip.id, { weight: 0.5 });
    layer.clips[0].weight = 0.5;
    const result = evaluateAnimationLayers(
      [layer],
      [additiveClip],
      { "transform.position": [1, 2, 3] },
      10
    );
    expect(result.values["transform.position"]).toEqual([3.5, 3, 3]);
  });

  it("reports missing clips, skips mute, and exposes deduplicated VFX sync metadata", () => {
    const missing = withClip("base", "missing_clip");
    const muted = withClip("headLook", "head_clip", { muted: true });
    const vfx = createAnimationLayer("character_1", "vfxSync");
    vfx.vfxEffectIds = ["effect_1", "effect_2", "effect_1"];
    const result = evaluateAnimationLayers(
      [missing, muted, vfx],
      [clip("head_clip", [{
        property: "bone.rotation.head",
        values: [[0, [20, 0, 0]]]
      }])],
      { "bone.rotation.head": [0, 0, 0] },
      0
    );
    expect(result.values["bone.rotation.head"]).toEqual([0, 0, 0]);
    expect(result.vfxEffectIds).toEqual(["effect_1", "effect_2"]);
    expect(result.warnings).toEqual([
      "ANIMATION_LAYER_CLIP_MISSING: missing_clip"
    ]);
    expect(result.activeLayerIds).toEqual([vfx.id]);
  });

  it("rejects unsafe frames and accessor layer records without mutation or invocation", () => {
    const base = { "transform.position": [1, 2, 3] as Vector3Tuple };
    const invalid = evaluateAnimationLayers([], [], base, Number.NaN);
    expect(invalid.values).toEqual(base);
    expect(invalid.values).not.toBe(base);

    let accessed = false;
    const hostile = Object.defineProperty({}, "kind", {
      enumerable: true,
      get() {
        accessed = true;
        return "base";
      }
    });
    expect(sanitizeAnimationLayers([hostile])).toEqual([]);
    expect(accessed).toBe(false);
  });
});
