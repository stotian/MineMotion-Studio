import { describe, expect, it } from "vitest";
import type { AnimationTrack } from "../../project/ProjectFile";
import {
  EMPTY_KEYFRAME_SELECTION,
  selectFrameRange,
  selectOnly,
  toggleKeyframeSelection
} from "./KeyframeSelection";

const track: AnimationTrack = {
  id: "camera:transform.position",
  targetId: "camera",
  property: "transform.position",
  keyframes: [
    { id: "a", frame: 0, value: [0, 0, 0], interpolation: "linear" },
    { id: "b", frame: 10, value: [1, 0, 0], interpolation: "linear" },
    { id: "c", frame: 20, value: [2, 0, 0], interpolation: "linear" }
  ]
};

describe("KeyframeSelection", () => {
  it("selects and toggles a keyframe without mutating prior state", () => {
    const ref = { trackId: track.id, keyframeId: "b" };
    const selected = selectOnly(ref);
    const toggled = toggleKeyframeSelection(selected, ref);

    expect(selected.selected).toEqual([ref]);
    expect(toggled.selected).toEqual([]);
  });

  it("selects an inclusive frame range from the anchor", () => {
    const anchored = selectOnly({ trackId: track.id, keyframeId: "a" });
    const ranged = selectFrameRange(
      anchored,
      [track],
      { trackId: track.id, keyframeId: "c" }
    );

    expect(ranged.selected.map((ref) => ref.keyframeId)).toEqual(["a", "b", "c"]);
  });

  it("starts a new selection when range target is on another track", () => {
    const ranged = selectFrameRange(
      EMPTY_KEYFRAME_SELECTION,
      [track],
      { trackId: track.id, keyframeId: "b" }
    );

    expect(ranged.selected).toEqual([{ trackId: track.id, keyframeId: "b" }]);
  });
});
