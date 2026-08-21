import { hashStringToUint32 } from "../../core/random/DeterministicRandom";
import {
  BUILD_SEQUENCER_MAX_BLOCKS,
  type BuildAxis,
  type BuildBlockPoint,
  type BuildRevealStrategy,
  type BuildSchedule,
  type BuildSequenceSettings
} from "./BuildSequenceTypes";

/**
 * Derive a deterministic block-by-block reveal schedule for a Minecraft build.
 *
 * Pure and content-addressed: a block's reveal frame depends only on its
 * coordinates, the strategy and the timing, never on the input array order, a
 * wall clock, or shared mutable state.
 */
export function buildBuildSchedule(
  blocks: readonly BuildBlockPoint[],
  settings: BuildSequenceSettings
): BuildSchedule {
  if (!Array.isArray(blocks)) {
    throw new TypeError("Build schedule requires an array of block points.");
  }
  if (blocks.length > BUILD_SEQUENCER_MAX_BLOCKS) {
    throw new RangeError(
      `Build schedule is limited to ${BUILD_SEQUENCER_MAX_BLOCKS} blocks; received ${blocks.length}.`
    );
  }
  const startFrame = requireFiniteInteger(settings.startFrame, "startFrame");
  const durationFrames = Math.max(0, requireFiniteInteger(settings.durationFrames, "durationFrames"));
  const fadeFrames = Math.max(0, requireFiniteInteger(settings.fadeFrames ?? 0, "fadeFrames"));
  validateStrategy(settings.strategy);
  validatePacing(settings.pacing);

  const warnings: string[] = [];
  const blockCount = blocks.length;
  if (blockCount === 0) {
    return {
      revealFrames: [],
      strategy: settings.strategy,
      startFrame,
      lastRevealFrame: startFrame,
      completeFrame: startFrame + fadeFrames,
      fadeFrames,
      blockCount: 0,
      distinctSteps: 0,
      warnings
    };
  }

  const keys = blocks.map((block, index) => {
    if (!isFinitePoint(block)) {
      throw new TypeError(`Block ${index} has non-finite coordinates.`);
    }
    return revealKey(block, settings.strategy);
  });

  const pacing = settings.pacing ?? "linear";
  const normalized =
    settings.strategy.kind === "layer"
      ? normalizedStepped(keys, settings.strategy.direction)
      : settings.strategy.kind === "scatter"
        ? normalizedRanked(keys, blocks, "ascending")
        : normalizedContinuous(keys, settings.strategy.direction);
  const revealFrames = normalized.map(
    (t) => startFrame + Math.round(applyPacing(t, pacing) * durationFrames)
  );

  const distinctSteps = new Set(revealFrames).size;
  const lastRevealFrame = revealFrames.reduce((max, frame) => Math.max(max, frame), startFrame);
  return {
    revealFrames,
    strategy: settings.strategy,
    startFrame,
    lastRevealFrame,
    completeFrame: lastRevealFrame + fadeFrames,
    fadeFrames,
    blockCount,
    distinctSteps,
    warnings
  };
}

/** The frame at which the block at `index` starts revealing. */
export function blockRevealFrame(schedule: BuildSchedule, index: number): number {
  const frame = schedule.revealFrames[index];
  if (frame === undefined) throw new RangeError(`No block at index ${index}.`);
  return frame;
}

/** Whether the block is at least partially visible at `frame`. */
export function isBlockRevealed(schedule: BuildSchedule, index: number, frame: number): boolean {
  return frame >= blockRevealFrame(schedule, index);
}

/**
 * Block opacity in [0, 1] at `frame`: 0 before its reveal, ramping linearly
 * across `fadeFrames`, then a solid 1. A 0-frame fade is an instant pop.
 */
export function blockRevealOpacity(schedule: BuildSchedule, index: number, frame: number): number {
  const reveal = blockRevealFrame(schedule, index);
  if (frame < reveal) return 0;
  if (schedule.fadeFrames <= 0) return 1;
  const progress = (frame - reveal) / schedule.fadeFrames;
  return progress >= 1 ? 1 : progress;
}

/** How many blocks have started revealing by `frame` (cheap aggregate). */
export function revealedBlockCount(schedule: BuildSchedule, frame: number): number {
  let count = 0;
  for (const reveal of schedule.revealFrames) {
    if (frame >= reveal) count += 1;
  }
  return count;
}

function revealKey(block: BuildBlockPoint, strategy: BuildRevealStrategy): number {
  switch (strategy.kind) {
    case "layer":
    case "scan":
      return axisValue(block, strategy.axis);
    case "radial": {
      const dx = block.x - strategy.origin[0];
      const dy = block.y - strategy.origin[1];
      const dz = block.z - strategy.origin[2];
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    case "scatter":
      return hashStringToUint32(`${strategy.seed >>> 0}:${block.x},${block.y},${block.z}`);
  }
}

function axisValue(block: BuildBlockPoint, axis: BuildAxis): number {
  return axis === "x" ? block.x : axis === "y" ? block.y : block.z;
}

// Continuous sweep: normalized position is where the key sits between the
// minimum and maximum, so a plane appears to glide across the structure.
function normalizedContinuous(
  keys: readonly number[],
  direction: "ascending" | "descending"
): number[] {
  let min = Infinity;
  let max = -Infinity;
  for (const key of keys) {
    if (key < min) min = key;
    if (key > max) max = key;
  }
  const span = max - min;
  return keys.map((key) => {
    const normalized = span === 0 ? 0 : (key - min) / span;
    return direction === "descending" ? 1 - normalized : normalized;
  });
}

// Discrete layers: every distinct key value is one step, so a whole plane of
// blocks pops in together, then the next.
function normalizedStepped(
  keys: readonly number[],
  direction: "ascending" | "descending"
): number[] {
  const distinct = [...new Set(keys)].sort((a, b) => a - b);
  if (direction === "descending") distinct.reverse();
  const stepIndex = new Map(distinct.map((value, index) => [value, index]));
  const lastStep = distinct.length - 1;
  return keys.map((key) => {
    const index = stepIndex.get(key) ?? 0;
    return lastStep <= 0 ? 0 : index / lastStep;
  });
}

// Seeded assembly: rank blocks by their content-addressed hash so the reveal
// order is pseudo-random but perfectly reproducible.
function normalizedRanked(
  keys: readonly number[],
  blocks: readonly BuildBlockPoint[],
  direction: "ascending" | "descending"
): number[] {
  const order = keys.map((_, index) => index).sort((a, b) => {
    if (keys[a] !== keys[b]) return keys[a] - keys[b];
    // Stable, order-independent tie-break by coordinates.
    return (
      blocks[a].x - blocks[b].x ||
      blocks[a].y - blocks[b].y ||
      blocks[a].z - blocks[b].z ||
      a - b
    );
  });
  if (direction === "descending") order.reverse();
  const lastRank = order.length - 1;
  const normalized = new Array<number>(keys.length);
  order.forEach((blockIndex, rank) => {
    normalized[blockIndex] = lastRank <= 0 ? 0 : rank / lastRank;
  });
  return normalized;
}

// Monotonic easing over [0,1], so pacing never changes reveal order — only its
// timing. Quadratic in/out with a smooth in-out.
function applyPacing(t: number, pacing: import("./BuildSequenceTypes").BuildPacing): number {
  const clamped = t <= 0 ? 0 : t >= 1 ? 1 : t;
  switch (pacing) {
    case "ease-in":
      // Slow start: early-ranked blocks are delayed, so the reveal accelerates.
      return 1 - (1 - clamped) * (1 - clamped);
    case "ease-out":
      // Fast start that decelerates into a settle.
      return clamped * clamped;
    case "ease-in-out":
      // Slow start and slow settle with a burst through the middle. This is the
      // inverse of easeInOutQuad so the reveal *progress* (not the rank map) is
      // the eased S-curve.
      return clamped < 0.5
        ? Math.sqrt(clamped / 2)
        : 1 - Math.sqrt((1 - clamped) / 2);
    case "linear":
    default:
      return clamped;
  }
}

function validateStrategy(strategy: BuildRevealStrategy): void {
  switch (strategy.kind) {
    case "layer":
    case "scan":
      if (strategy.axis !== "x" && strategy.axis !== "y" && strategy.axis !== "z") {
        throw new TypeError(`Unknown build axis: ${String((strategy as { axis: unknown }).axis)}`);
      }
      return;
    case "radial":
      if (!Array.isArray(strategy.origin) || strategy.origin.length !== 3 || !strategy.origin.every(Number.isFinite)) {
        throw new TypeError("Radial build origin must be three finite numbers.");
      }
      return;
    case "scatter":
      if (!Number.isFinite(strategy.seed)) {
        throw new TypeError("Scatter build seed must be finite.");
      }
      return;
    default:
      throw new TypeError(`Unknown build strategy: ${String((strategy as { kind: unknown }).kind)}`);
  }
}

function validatePacing(pacing: import("./BuildSequenceTypes").BuildPacing | undefined): void {
  if (pacing === undefined) return;
  if (pacing !== "linear" && pacing !== "ease-in" && pacing !== "ease-out" && pacing !== "ease-in-out") {
    throw new TypeError(`Unknown build pacing: ${String(pacing)}`);
  }
}

function isFinitePoint(block: BuildBlockPoint): boolean {
  return Number.isFinite(block.x) && Number.isFinite(block.y) && Number.isFinite(block.z);
}

function requireFiniteInteger(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be a finite number.`);
  return Math.round(value);
}
