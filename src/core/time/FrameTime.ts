export interface FrameRange {
  startFrame: number;
  endFrame: number;
}

export type FrameRounding = "floor" | "nearest" | "ceil";

export function assertFrameRate(fps: number): number {
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new RangeError("Frames per second must be a finite positive number.");
  }
  return fps;
}

export function normalizeFrame(frame: number): number {
  if (!Number.isFinite(frame)) return 0;
  return Math.max(0, Math.round(frame));
}

export function normalizeFrameRange(range: FrameRange): FrameRange {
  const startFrame = normalizeFrame(range.startFrame);
  const endFrame = normalizeFrame(range.endFrame);
  return startFrame <= endFrame
    ? { startFrame, endFrame }
    : { startFrame: endFrame, endFrame: startFrame };
}

export function frameToSeconds(frame: number, fps: number): number {
  return normalizeFrame(frame) / assertFrameRate(fps);
}

export function secondsToFrame(
  seconds: number,
  fps: number,
  rounding: FrameRounding = "nearest"
): number {
  const value = Math.max(0, Number.isFinite(seconds) ? seconds : 0) * assertFrameRate(fps);
  if (rounding === "floor") return Math.floor(value);
  if (rounding === "ceil") return Math.ceil(value);
  return Math.round(value);
}

export function clampFrame(frame: number, range: FrameRange): number {
  const normalized = normalizeFrameRange(range);
  return Math.min(normalized.endFrame, Math.max(normalized.startFrame, normalizeFrame(frame)));
}

export function snapFrame(frame: number, interval = 1): number {
  const safeInterval = Math.max(1, normalizeFrame(interval));
  return Math.max(0, Math.round(normalizeFrame(frame) / safeInterval) * safeInterval);
}
