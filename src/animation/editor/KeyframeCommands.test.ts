import { describe, expect, it } from "vitest";
import type { AnimationTrack } from "../../project/ProjectFile";
import {
  deleteSelectedKeyframes,
  moveSelectedKeyframes,
  reduceSelectedKeyframeNoise,
  removeRedundantSelectedKeyframes,
  scaleSelectedKeyframeTiming,
  setSelectedInterpolation,
  smoothSelectedKeyframes,
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

  it("removes only selected redundant linear interior keys", () => {
    const cleanupTrack: AnimationTrack = {
      ...track,
      keyframes: [
        { id: "a", frame: 0, value: [0, 0, 0], interpolation: "linear" },
        { id: "b", frame: 5, value: [5, 10, 0], interpolation: "linear" },
        { id: "c", frame: 10, value: [10, 20, 0], interpolation: "linear" },
        { id: "d", frame: 15, value: [15, 31, 0], interpolation: "linear" }
      ]
    };
    const result = removeRedundantSelectedKeyframes(
      [cleanupTrack],
      [
        { trackId: cleanupTrack.id, keyframeId: "a" },
        { trackId: cleanupTrack.id, keyframeId: "b" },
        { trackId: cleanupTrack.id, keyframeId: "d" }
      ]
    );
    expect(result.changed).toBe(true);
    expect(result.removedCount).toBe(1);
    expect(result.tracks[0].keyframes.map((keyframe) => keyframe.id))
      .toEqual(["a", "c", "d"]);
    expect(result.selection.map((ref) => ref.keyframeId)).toEqual(["a", "d"]);
  });

  it("reduces bounded low-amplitude noise while retaining large deviations", () => {
    const noisy: AnimationTrack = {
      ...track,
      keyframes: [
        { id: "a", frame: 0, value: [0, 0, 0], interpolation: "ease-in" },
        { id: "b", frame: 5, value: [5.1, 0, 0], interpolation: "bezier" },
        { id: "c", frame: 10, value: [10, 0, 0], interpolation: "linear" },
        { id: "d", frame: 15, value: [20, 0, 0], interpolation: "linear" },
        { id: "e", frame: 20, value: [20, 0, 0], interpolation: "linear" }
      ]
    };
    const refs = ["b", "d"].map((keyframeId) => ({
      trackId: noisy.id,
      keyframeId
    }));
    const result = reduceSelectedKeyframeNoise([noisy], refs, 0.2);
    expect(result.tracks[0].keyframes.map((keyframe) => keyframe.id))
      .toEqual(["a", "c", "d", "e"]);
    expect(result.removedCount).toBe(1);
  });

  it("smooths selected interior values without moving keys or endpoints", () => {
    const jagged: AnimationTrack = {
      ...track,
      keyframes: [
        { id: "a", frame: 0, value: [0, 0, 0] },
        { id: "b", frame: 4, value: [10, 4, -2] },
        { id: "c", frame: 10, value: [0, 10, 0] }
      ]
    };
    const smoothed = smoothSelectedKeyframes(
      [jagged],
      [{ trackId: jagged.id, keyframeId: "b" }],
      0.5
    );
    expect(smoothed[0].keyframes.map((keyframe) => keyframe.frame))
      .toEqual([0, 4, 10]);
    expect(smoothed[0].keyframes[1].value).toEqual([5, 4, -1]);
    expect(smoothed[0].keyframes[0].value).toEqual([0, 0, 0]);
    expect(smoothed[0].keyframes[2].value).toEqual([0, 10, 0]);
    expect(smoothSelectedKeyframes([jagged], [], 0.5)).toEqual([jagged]);
  });
});
