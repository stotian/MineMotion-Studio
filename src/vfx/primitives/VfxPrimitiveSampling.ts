import type { Vector3Tuple } from "../../core/scene/SceneTypes";
import { randomFloat01 } from "../../core/random/DeterministicRandom";

export function normalizePrimitiveNumber(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

export function lerpPrimitiveNumber(
  start: number,
  end: number,
  progress: number
): number {
  return normalizePrimitiveNumber(start * (1 - progress) + end * progress);
}

export function lerpPrimitiveVector(
  start: Vector3Tuple,
  end: Vector3Tuple,
  progress: number
): Vector3Tuple {
  return [
    lerpPrimitiveNumber(start[0], end[0], progress),
    lerpPrimitiveNumber(start[1], end[1], progress),
    lerpPrimitiveNumber(start[2], end[2], progress)
  ];
}

export function isFinitePrimitiveVector(value: Vector3Tuple): boolean {
  return value.every(
    (component) => Number.isFinite(component) && !Object.is(component, -0)
  );
}

/**
 * Selects a nested spatial refinement set while retaining both endpoints.
 * Taking a longer prefix of the internal refinement order only adds canonical
 * full-resolution sample indices; it never moves a previously selected point.
 */
export function selectNestedSampleIndices(
  fullSegments: number,
  evaluatedSegments: number
): number[] {
  if (evaluatedSegments >= fullSegments) {
    return Array.from({ length: fullSegments + 1 }, (_, index) => index);
  }

  const targetSize = evaluatedSegments + 1;
  const ordered: number[] = [0, fullSegments];
  const seen = new Set(ordered);
  for (
    let denominator = 2;
    ordered.length < targetSize && denominator <= fullSegments * 2;
    denominator *= 2
  ) {
    for (
      let numerator = 1;
      numerator < denominator && ordered.length < targetSize;
      numerator += 2
    ) {
      const index = Math.round((numerator * fullSegments) / denominator);
      if (index <= 0 || index >= fullSegments || seen.has(index)) continue;
      seen.add(index);
      ordered.push(index);
    }
  }
  for (let index = 1; index < fullSegments && ordered.length < targetSize; index += 1) {
    if (seen.has(index)) continue;
    seen.add(index);
    ordered.push(index);
  }
  return ordered.sort((left, right) => left - right);
}

export function samplePolyline(
  points: readonly Vector3Tuple[],
  progress: number
): Vector3Tuple {
  if (progress <= 0) {
    return [
      normalizePrimitiveNumber(points[0][0]),
      normalizePrimitiveNumber(points[0][1]),
      normalizePrimitiveNumber(points[0][2])
    ];
  }
  if (progress >= 1) {
    const last = points[points.length - 1];
    return [
      normalizePrimitiveNumber(last[0]),
      normalizePrimitiveNumber(last[1]),
      normalizePrimitiveNumber(last[2])
    ];
  }
  const scaled = progress * (points.length - 1);
  const index = Math.floor(scaled);
  return lerpPrimitiveVector(points[index], points[index + 1], scaled - index);
}

export function randomUnitVector(
  azimuthSeed: number,
  heightSeed: number,
  sampleIndex: number
): Vector3Tuple {
  const azimuth = randomFloat01(azimuthSeed, sampleIndex) * Math.PI * 2;
  const y = randomFloat01(heightSeed, sampleIndex) * 2 - 1;
  const horizontal = Math.sqrt(Math.max(0, 1 - y * y));
  return [
    normalizePrimitiveNumber(Math.cos(azimuth) * horizontal),
    normalizePrimitiveNumber(y),
    normalizePrimitiveNumber(Math.sin(azimuth) * horizontal)
  ];
}
