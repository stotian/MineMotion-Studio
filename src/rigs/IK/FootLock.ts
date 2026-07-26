import type { GroundSample } from "../../minecraft/GroundSampler";
import type { RigVector3Tuple } from "../RigTypes";

export type FootLockLimb = "leftLeg" | "rightLeg";

export interface FootLockAnchor {
  limb: FootLockLimb;
  startFrame: number;
  endFrame: number;
  worldPosition: RigVector3Tuple;
  groundHeight: number;
  groundOffset: number;
}

export interface FootLockFrameSample {
  frame: number;
  locked: boolean;
  naturalWorldPosition: RigVector3Tuple;
  targetWorldPosition: RigVector3Tuple;
  correctionDistance: number;
  horizontalSlideDistance: number;
}

export interface FootLockAnchorResult {
  ok: boolean;
  anchor: FootLockAnchor | null;
  error: string | null;
}

export const FOOT_LOCK_LIMITS = Object.freeze({
  maximumFrames: 600,
  maximumGroundOffset: 4
});

export function createFootLockAnchor(
  limb: FootLockLimb,
  startFrame: number,
  endFrame: number,
  naturalWorldPosition: RigVector3Tuple,
  ground: GroundSample,
  groundOffset = 0
): FootLockAnchorResult {
  if (!validFrame(startFrame) || !validFrame(endFrame) || endFrame < startFrame) {
    return failure("FOOT_LOCK_RANGE_INVALID: Foot lock frames must form an increasing integer range.");
  }
  if (endFrame - startFrame + 1 > FOOT_LOCK_LIMITS.maximumFrames) {
    return failure(`FOOT_LOCK_RANGE_TOO_LARGE: Foot lock ranges are limited to ${FOOT_LOCK_LIMITS.maximumFrames} frames.`);
  }
  if (!finiteVector(naturalWorldPosition)) {
    return failure("FOOT_LOCK_POSITION_INVALID: The sampled foot position must be finite.");
  }
  if (!ground.hit) {
    return failure(`FOOT_LOCK_GROUND_MISSING: ${ground.warning}.`);
  }
  const safeGroundOffset = Number.isFinite(groundOffset)
    ? Math.min(FOOT_LOCK_LIMITS.maximumGroundOffset, Math.max(-FOOT_LOCK_LIMITS.maximumGroundOffset, groundOffset))
    : 0;
  const worldPosition: RigVector3Tuple = [
    naturalWorldPosition[0],
    ground.height + safeGroundOffset,
    naturalWorldPosition[2]
  ];
  return {
    ok: true,
    anchor: Object.freeze({
      limb,
      startFrame,
      endFrame,
      worldPosition: Object.freeze(worldPosition) as RigVector3Tuple,
      groundHeight: ground.height,
      groundOffset: safeGroundOffset
    }),
    error: null
  };
}

export function sampleFootLockFrame(
  anchor: FootLockAnchor,
  frame: number,
  naturalWorldPosition: RigVector3Tuple
): FootLockFrameSample {
  const locked = validFrame(frame) &&
    frame >= anchor.startFrame &&
    frame <= anchor.endFrame &&
    finiteVector(naturalWorldPosition);
  const targetWorldPosition = locked
    ? [...anchor.worldPosition] as RigVector3Tuple
    : [...naturalWorldPosition] as RigVector3Tuple;
  const correctionDistance = locked ? distance(naturalWorldPosition, targetWorldPosition) : 0;
  const horizontalSlideDistance = locked
    ? Math.hypot(
        naturalWorldPosition[0] - targetWorldPosition[0],
        naturalWorldPosition[2] - targetWorldPosition[2]
      )
    : 0;
  return {
    frame,
    locked,
    naturalWorldPosition: [...naturalWorldPosition],
    targetWorldPosition,
    correctionDistance,
    horizontalSlideDistance
  };
}

function failure(error: string): FootLockAnchorResult {
  return { ok: false, anchor: null, error };
}

function validFrame(frame: number): boolean {
  return Number.isInteger(frame) && frame >= 0;
}

function finiteVector(value: unknown): value is RigVector3Tuple {
  return Array.isArray(value) &&
    value.length === 3 &&
    value.every((component) => typeof component === "number" && Number.isFinite(component));
}

function distance(left: RigVector3Tuple, right: RigVector3Tuple): number {
  return Math.hypot(
    left[0] - right[0],
    left[1] - right[1],
    left[2] - right[2]
  );
}
