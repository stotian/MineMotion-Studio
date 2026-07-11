import {
  clampFrame,
  frameToSeconds,
  normalizeFrameRange,
  secondsToFrame,
  snapFrame
} from "./FrameTime";
import { createPlaybackClock, samplePlaybackClock } from "./PlaybackClock";

describe("frame time contracts", () => {
  it("converts between frames and seconds", () => {
    expect(frameToSeconds(48, 24)).toBe(2);
    expect(secondsToFrame(1.5, 24)).toBe(36);
    expect(secondsToFrame(1.01, 24, "floor")).toBe(24);
  });

  it("normalizes ranges, clamps, and snaps", () => {
    expect(normalizeFrameRange({ startFrame: 20, endFrame: 5 })).toEqual({
      startFrame: 5,
      endFrame: 20
    });
    expect(clampFrame(30, { startFrame: 5, endFrame: 20 })).toBe(20);
    expect(snapFrame(13, 5)).toBe(15);
  });

  it("samples looping playback from explicit clock state", () => {
    const state = createPlaybackClock(8, 1000);
    expect(
      samplePlaybackClock(state, 2000, {
        fps: 4,
        startFrame: 0,
        endFrame: 9,
        loop: true
      })
    ).toEqual({ frame: 2, elapsedFrames: 4, completed: false, wrapped: true });
  });
});
