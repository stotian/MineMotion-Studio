import { describe, expect, it } from "vitest";
import type { AnimationTrack } from "../../project/ProjectFile";
import { copyKeyframes, pasteKeyframes } from "./KeyframeClipboard";

const tracks: AnimationTrack[] = [{
  id: "camera:transform.position",
  targetId: "camera",
  property: "transform.position",
  keyframes: [
    { id: "a", frame: 10, value: [1, 2, 3], interpolation: "ease-in" },
    { id: "b", frame: 20, value: [4, 5, 6], interpolation: "ease-out" }
  ]
}];

describe("KeyframeClipboard", () => {
  it("copies relative timing and pastes at the playhead", () => {
    const clipboard = copyKeyframes(tracks, [
      { trackId: tracks[0].id, keyframeId: "a" },
      { trackId: tracks[0].id, keyframeId: "b" }
    ]);
    const pasted = pasteKeyframes(tracks, clipboard, 100);

    expect(clipboard.durationFrames).toBe(10);
    expect(pasted.tracks[0].keyframes.map((keyframe) => keyframe.frame)).toEqual([
      10,
      20,
      100,
      110
    ]);
    expect(pasted.selection).toHaveLength(2);
  });

  it("returns an empty clipboard when nothing is selected", () => {
    expect(copyKeyframes(tracks, [])).toEqual({ entries: [], durationFrames: 0 });
  });
});
