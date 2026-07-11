import {
  assertFrameRate,
  clampFrame,
  normalizeFrame,
  normalizeFrameRange,
  type FrameRange
} from "./FrameTime";

export interface PlaybackClockState {
  anchorFrame: number;
  anchorTimeMs: number;
}

export interface PlaybackClockOptions extends FrameRange {
  fps: number;
  loop: boolean;
}

export interface PlaybackClockSample {
  frame: number;
  elapsedFrames: number;
  completed: boolean;
  wrapped: boolean;
}

export function createPlaybackClock(
  anchorFrame: number,
  anchorTimeMs: number
): PlaybackClockState {
  return {
    anchorFrame: normalizeFrame(anchorFrame),
    anchorTimeMs: Number.isFinite(anchorTimeMs) ? anchorTimeMs : 0
  };
}

export function samplePlaybackClock(
  state: PlaybackClockState,
  nowMs: number,
  options: PlaybackClockOptions
): PlaybackClockSample {
  const fps = assertFrameRate(options.fps);
  const range = normalizeFrameRange(options);
  const elapsedMs = Math.max(0, (Number.isFinite(nowMs) ? nowMs : state.anchorTimeMs) - state.anchorTimeMs);
  const elapsedFrames = Math.floor((elapsedMs / 1000) * fps);
  const rawFrame = state.anchorFrame + elapsedFrames;

  if (!options.loop) {
    return {
      frame: clampFrame(rawFrame, range),
      elapsedFrames,
      completed: rawFrame >= range.endFrame,
      wrapped: false
    };
  }

  const frameCount = range.endFrame - range.startFrame + 1;
  const offset = ((rawFrame - range.startFrame) % frameCount + frameCount) % frameCount;
  return {
    frame: range.startFrame + offset,
    elapsedFrames,
    completed: false,
    wrapped: rawFrame > range.endFrame
  };
}
