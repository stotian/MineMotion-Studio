import type { Keyframe, Vector3Tuple } from "../project/ProjectFile";
import { applyInterpolationCurve } from "./editor/InterpolationCurves";

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVector3(
  a: Vector3Tuple,
  b: Vector3Tuple,
  t: number
): Vector3Tuple {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function sampleVectorTrack(
  keyframes: Keyframe<Vector3Tuple>[],
  frame: number
): Vector3Tuple | null {
  if (keyframes.length === 0) {
    return null;
  }

  // Playback samples every track every frame, so avoid the per-sample clone and
  // sort when the keyframes are already ordered (the common case for maintained
  // tracks). Only unsorted input pays for a sorted copy.
  const sorted = isSortedByFrame(keyframes)
    ? keyframes
    : [...keyframes].sort((a, b) => a.frame - b.frame);

  if (frame <= sorted[0].frame) {
    return [...sorted[0].value];
  }

  const last = sorted[sorted.length - 1];
  if (frame >= last.frame) {
    return [...last.value];
  }

  // Binary search for the segment [left, right] that brackets `frame`.
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (sorted[mid].frame <= frame) lo = mid;
    else hi = mid - 1;
  }
  const left = sorted[lo];
  const right = sorted[lo + 1];
  const span = right.frame - left.frame || 1;
  const t = applyInterpolationCurve(
    left.interpolation ?? "linear",
    (frame - left.frame) / span
  );
  return lerpVector3(left.value, right.value, t);
}

function isSortedByFrame(keyframes: Keyframe<Vector3Tuple>[]): boolean {
  for (let index = 1; index < keyframes.length; index += 1) {
    if (keyframes[index].frame < keyframes[index - 1].frame) return false;
  }
  return true;
}
