import { describe, expect, it } from "vitest";
import { createEffectInstance } from "./EffectRegistry";
import {
  createEffectTimelineItems,
  createEffectTimelineLaneItems,
  getTimelineFrameAtPosition,
  getTimelineMoveStartFrame,
  syncEffectTimelineLane
} from "./EffectTimelineTrack";
import { createInitialProject } from "../project/ProjectStore";

function createEffects() {
  return [
    {
      ...createEffectInstance("shockwave", {
        id: "effect_z",
        startFrame: 20
      }),
      enabled: false
    },
    createEffectInstance("flash", {
      id: "effect_b",
      startFrame: 5
    }),
    createEffectInstance("glowBurst", {
      id: "effect_a",
      startFrame: 20
    })
  ];
}

describe("EffectTimelineTrack", () => {
  it("projects enabled and disabled effects without mutating source order", () => {
    const effects = createEffects();
    const before = structuredClone(effects);

    expect(createEffectTimelineItems(effects).map((item) => item.effectId)).toEqual([
      "effect_b",
      "effect_z",
      "effect_a"
    ]);
    expect(effects).toEqual(before);
  });

  it("uses the persisted array order as the deterministic tie breaker", () => {
    const effects = createEffects();

    const first = createEffectTimelineItems(effects).map((item) => item.effectId);
    const reordered = createEffectTimelineItems([
      effects[2],
      effects[1],
      effects[0]
    ]).map((item) => item.effectId);

    expect(first).toEqual(["effect_b", "effect_z", "effect_a"]);
    expect(reordered).toEqual(["effect_b", "effect_a", "effect_z"]);
  });

  it("builds canonical lane items with stable IDs and effect names", () => {
    const effects = createEffects();

    expect(createEffectTimelineLaneItems(effects)).toEqual(
      createEffectTimelineItems(effects).map((item) => ({
        id: `item_${item.effectId}`,
        type: "effect",
        label: effects.find((effect) => effect.id === item.effectId)?.name,
        targetId: item.effectId,
        effectId: item.effectId,
        startFrame: item.startFrame,
        durationFrames: item.durationFrames
      }))
    );
  });

  it("updates exactly one canonical effect lane and preserves foreign lanes", () => {
    const initial = createInitialProject();
    const effects = createEffects();
    const customLane = {
      id: "track_camera_custom",
      type: "camera" as const,
      name: "Custom Camera",
      items: []
    };
    const project = {
      ...initial,
      effects: { instances: effects },
      animation: {
        ...initial.animation,
        timelineTracks: [
          ...initial.animation.timelineTracks,
          {
            id: "track_effects_duplicate",
            type: "effect" as const,
            name: "Duplicate Effects",
            items: []
          },
          customLane
        ]
      }
    };

    const synced = syncEffectTimelineLane(project);
    const effectLanes = synced.animation.timelineTracks.filter(
      (track) => track.type === "effect"
    );

    expect(effectLanes).toHaveLength(1);
    expect(effectLanes[0].id).toBe("track_effects_main");
    expect(effectLanes[0].items).toEqual(createEffectTimelineLaneItems(effects));
    expect(synced.animation.timelineTracks).toContainEqual(customLane);
    expect(project.animation.timelineTracks).toHaveLength(8);
  });

  it("maps pointer drops to clamped deterministic timeline frames", () => {
    expect(getTimelineFrameAtPosition(100, 100, 200, 300)).toBe(0);
    expect(getTimelineFrameAtPosition(200, 100, 200, 300)).toBe(150);
    expect(getTimelineFrameAtPosition(300, 100, 200, 300)).toBe(300);
    expect(getTimelineFrameAtPosition(500, 100, 200, 300)).toBe(300);
    expect(() => getTimelineFrameAtPosition(10, 0, 0, 300)).toThrow(
      /coordinates/i
    );
  });

  it("preserves the grabbed offset while moving a timeline block", () => {
    expect(getTimelineMoveStartFrame(150, 6, 12, 300)).toBe(144);
    expect(getTimelineMoveStartFrame(3, 6, 12, 300)).toBe(0);
    expect(getTimelineMoveStartFrame(300, 6, 12, 300)).toBe(288);
  });

  it("does not jump when a one-frame block is inflated by visual min-width", () => {
    const effectStartFrame = 100;
    const pointerFrame = getTimelineFrameAtPosition(109, 0, 300, 300);
    const grabOffsetFrames = pointerFrame - effectStartFrame;

    expect(grabOffsetFrames).toBe(9);
    expect(
      getTimelineMoveStartFrame(pointerFrame, grabOffsetFrames, 1, 300)
    ).toBe(effectStartFrame);
  });
});
