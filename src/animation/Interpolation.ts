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

  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);

  if (frame <= sorted[0].frame) {
    return [...sorted[0].value];
  }

  const last = sorted[sorted.length - 1];
  if (frame >= last.frame) {
    return [...last.value];
  }

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const left = sorted[index];
    const right = sorted[index + 1];
    if (frame >= left.frame && frame <= right.frame) {
      const span = right.frame - left.frame || 1;
      const t = applyInterpolationCurve(
        left.interpolation ?? "linear",
        (frame - left.frame) / span
      );
      return lerpVector3(left.value, right.value, t);
    }
  }

  return null;
}
