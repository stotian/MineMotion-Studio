import type { KeyframeInterpolation } from "../../project/ProjectFile";

export function applyInterpolationCurve(
  interpolation: KeyframeInterpolation,
  t: number
): number {
  const value = Math.min(1, Math.max(0, t));
  if (interpolation === "constant") return 0;
  if (interpolation === "ease-in") return value * value;
  if (interpolation === "ease-out") return 1 - (1 - value) * (1 - value);
  if (interpolation === "ease-in-out" || interpolation === "bezier") {
    return value * value * (3 - 2 * value);
  }
  return value;
}

export function createCurveSamples(
  interpolation: KeyframeInterpolation,
  steps = 24
): Array<{ t: number; value: number }> {
  const safeSteps = Math.max(2, Math.round(steps));
  return Array.from({ length: safeSteps + 1 }, (_, index) => {
    const t = index / safeSteps;
    return { t, value: applyInterpolationCurve(interpolation, t) };
  });
}
