import { describe, expect, it } from "vitest";
import type {
  AnimationTrack,
  NlaClipInstance,
  TimelineItem,
  TimelineTrackLane
} from "../../project/ProjectFile";
import {
  collectDisabledEffectIds,
  collectKeyframeFrames,
  createTimelineTicks,
  getNlaClipStyle,
  getTimelineItemStyle,
  normalizeTimelineDuration,
  shouldDisplayTimelineTrack
} from "./TimelineViewModel";

const TRACK = {
  id: "track",
  targetId: "target",
  property: "transform.position",
  keyframes: []
} satisfies AnimationTrack;

function lane(
  type: TimelineTrackLane["type"],
  items: TimelineItem[] = []
): TimelineTrackLane {
  return { id: `lane-${type}`, type, name: type, items };
}

describe("TimelineViewModel characterization", () => {
  it("keeps the existing 21 rounded ruler ticks and clamps empty durations", () => {
    expect(normalizeTimelineDuration(0)).toBe(1);
    expect(createTimelineTicks(10)).toEqual([
      0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5,
      6, 6, 7, 7, 8, 8, 9, 9, 10, 10
    ]);
  });

  it("preserves first-seen keyframe marker order while removing duplicates", () => {
    expect(
      collectKeyframeFrames([
        { ...TRACK, id: "a", keyframes: [
          { frame: 12, value: [0, 0, 0] },
          { frame: 4, value: [0, 0, 0] }
        ] },
        { ...TRACK, id: "b", keyframes: [
          { frame: 12, value: [0, 0, 0] },
          { frame: 20, value: [0, 0, 0] }
        ] }
      ])
    ).toEqual([12, 4, 20]);
  });

  it("keeps structural rig/effect/audio/sky lanes visible when empty", () => {
    expect(shouldDisplayTimelineTrack(lane("rig"))).toBe(true);
    expect(shouldDisplayTimelineTrack(lane("effect"))).toBe(true);
    expect(shouldDisplayTimelineTrack(lane("audio"))).toBe(true);
    expect(shouldDisplayTimelineTrack(lane("sky"))).toBe(true);
    expect(shouldDisplayTimelineTrack(lane("camera"))).toBe(false);
    expect(
      shouldDisplayTimelineTrack(
        lane("camera", [{
          id: "item",
          type: "camera",
          label: "Camera",
          startFrame: 0,
          durationFrames: 1,
          targetId: "camera"
        }])
      )
    ).toBe(true);
  });

  it("retains disabled effect identity and existing minimum visual widths", () => {
    expect(
      [...collectDisabledEffectIds([
        { id: "enabled", enabled: true },
        { id: "disabled", enabled: false }
      ])]
    ).toEqual(["disabled"]);

    expect(getTimelineItemStyle({ startFrame: 25, durationFrames: 0 }, 100))
      .toEqual({ left: "25%", width: "1%" });
    expect(
      getNlaClipStyle(
        {
          startFrame: 25,
          durationFrames: 0
        } satisfies Pick<NlaClipInstance, "startFrame" | "durationFrames">,
        100
      )
    ).toEqual({ left: "25%", width: "2%" });
  });
});
