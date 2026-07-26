import { describe, expect, it } from "vitest";
import type { AnimationTrack } from "../../project/ProjectFile";
import {
  deleteSelectedKeyframes,
  loopSelectedKeyframes,
  mirrorSelectedKeyframes,
  moveSelectedKeyframes,
  reduceSelectedKeyframeNoise,
  removeRedundantSelectedKeyframes,
  reverseSelectedKeyframes,
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

  it("loops a selected range deterministically without duplicate boundary frames", () => {
    const loopTrack: AnimationTrack = {
      ...track,
      keyframes: [
        { id: "a", frame: 0, value: [0, 0, 0], interpolation: "ease-in" },
        { id: "b", frame: 5, value: [5, 0, 0], interpolation: "linear" },
        { id: "c", frame: 10, value: [0, 0, 0], interpolation: "linear" }
      ]
    };
    const refs = loopTrack.keyframes.map((keyframe) => ({
      trackId: loopTrack.id,
      keyframeId: keyframe.id!
    }));
    const first = loopSelectedKeyframes([loopTrack], refs, 1, 20);
    const second = loopSelectedKeyframes([loopTrack], refs, 1, 20);
    expect(second).toEqual(first);
    expect(first.changed).toBe(true);
    expect(first.tracks[0].keyframes.map((keyframe) => keyframe.frame))
      .toEqual([0, 5, 10, 15, 20]);
    expect(first.tracks[0].keyframes.find((keyframe) => keyframe.frame === 10)
      ?.interpolation).toBe("ease-in");
    expect(first.selection).toHaveLength(2);
    expect(loopTrack.keyframes[2].interpolation).toBe("linear");
    const bounded = loopSelectedKeyframes([loopTrack], refs, 1, 10);
    expect(bounded.changed).toBe(false);
    expect(bounded.tracks).toEqual([loopTrack]);
  });

  it("reverses selected timing with easing and rejects unselected collisions", () => {
    const reverseTrack: AnimationTrack = {
      ...track,
      keyframes: [
        { id: "a", frame: 0, value: [0, 0, 0], interpolation: "ease-in" },
        { id: "b", frame: 4, value: [4, 0, 0], interpolation: "ease-out" },
        { id: "c", frame: 10, value: [10, 0, 0], interpolation: "linear" }
      ]
    };
    const refs = reverseTrack.keyframes.map((keyframe) => ({
      trackId: reverseTrack.id,
      keyframeId: keyframe.id!
    }));
    const result = reverseSelectedKeyframes([reverseTrack], refs);
    expect(result.changed).toBe(true);
    expect(result.tracks[0].keyframes.map((keyframe) => [
      keyframe.id,
      keyframe.frame,
      keyframe.interpolation
    ])).toEqual([
      ["c", 0, "ease-in"],
      ["b", 6, "ease-out"],
      ["a", 10, "ease-in"]
    ]);

    const collisionTrack: AnimationTrack = {
      ...reverseTrack,
      keyframes: [
        ...reverseTrack.keyframes,
        { id: "d", frame: 6, value: [6, 0, 0] }
      ]
    };
    const collision = reverseSelectedKeyframes(
      [collisionTrack],
      refs
    );
    expect(collision.changed).toBe(false);
    expect(collision.error).toContain("KEYFRAME_REVERSE_COLLISION");
  });

  it("mirrors paired rig keys and transform motion from an immutable snapshot", () => {
    const left: AnimationTrack = {
      id: "hero:bone.rotation.leftArm",
      targetId: "hero",
      property: "bone.rotation.leftArm",
      keyframes: [{ id: "left", frame: 4, value: [10, 20, 30] }]
    };
    const right: AnimationTrack = {
      id: "hero:bone.rotation.rightArm",
      targetId: "hero",
      property: "bone.rotation.rightArm",
      keyframes: [{ id: "right", frame: 4, value: [-5, 6, 7] }]
    };
    const position: AnimationTrack = {
      id: "hero:transform.position",
      targetId: "hero",
      property: "transform.position",
      keyframes: [{ id: "position", frame: 4, value: [3, 2, 1] }]
    };
    const result = mirrorSelectedKeyframes(
      [left, right, position],
      [
        { trackId: left.id, keyframeId: "left" },
        { trackId: right.id, keyframeId: "right" },
        { trackId: position.id, keyframeId: "position" }
      ]
    );
    expect(result.changed).toBe(true);
    expect(result.tracks.find((entry) => entry.id === left.id)
      ?.keyframes[0].value).toEqual([-5, -6, -7]);
    expect(result.tracks.find((entry) => entry.id === right.id)
      ?.keyframes[0].value).toEqual([10, -20, -30]);
    expect(result.tracks.find((entry) => entry.id === position.id)
      ?.keyframes[0].value).toEqual([-3, 2, 1]);
    expect(left.keyframes[0].value).toEqual([10, 20, 30]);

    const symmetric = mirrorSelectedKeyframes(
      [{
        ...position,
        keyframes: [{ id: "center", frame: 0, value: [0, 2, 1] }]
      }],
      [{ trackId: position.id, keyframeId: "center" }]
    );
    expect(symmetric.changed).toBe(false);
    expect(symmetric.tracks[0].keyframes[0].value).toEqual([0, 2, 1]);
  });
});
