import { describe, expect, it } from "vitest";
import type { AnimationTrack } from "../../project/ProjectFile";
import {
  deleteSelectedKeyframes,
  moveSelectedKeyframes,
  scaleSelectedKeyframeTiming,
  setSelectedInterpolation,
  snapSelectedKeyframes
} from "./KeyframeCommands";

const track: AnimationTrack = {
  id: "hero:transform.rotation",
  targetId: "hero",
  property: "transform.rotation",
  keyframes: [
    { id: "a", frame: 3, value: [0, 0, 0], interpolation: "linear" },
    { id: "b", frame: 11, value: [0, 90, 0], interpolation: "linear" }
  ]
};
const selection = [{ trackId: track.id, keyframeId: "b" }];

describe("KeyframeCommands", () => {
  it("moves, snaps and scales selected timing", () => {
    const moved = moveSelectedKeyframes([track], selection, 3, 100);
    const snapped = snapSelectedKeyframes(moved, selection, 5, 100);
    const scaled = scaleSelectedKeyframeTiming(snapped, selection, 2, 0, 100);

    expect(moved[0].keyframes[1].frame).toBe(14);
    expect(snapped[0].keyframes[1].frame).toBe(15);
    expect(scaled[0].keyframes[1].frame).toBe(30);
  });

  it("updates interpolation and deletes selected keys", () => {
    const eased = setSelectedInterpolation([track], selection, "ease-in-out");
    const deleted = deleteSelectedKeyframes(eased, selection);

    expect(eased[0].keyframes[1].interpolation).toBe("ease-in-out");
    expect(deleted[0].keyframes.map((keyframe) => keyframe.id)).toEqual(["a"]);
  });
});
