// Experimental "Build Sequencer": a Minecraft-native cinematic feature that
// reveals an imported structure block-by-block over time, the way a real build
// timelapse or a "magic assembly" shot looks. It is deterministic (no wall
// clock, no uncontrolled randomness) and pure: it derives a reveal schedule
// from block coordinates and never mutates the project.
//
// This is intentionally NOT persisted in project schema 10 yet. Like motion
// paths and foot locks (TD-035/TD-033), it is a session-derived view; a tested
// schema migration would own persistence later.

export type BuildAxis = "x" | "y" | "z";
export type BuildDirection = "ascending" | "descending";

/**
 * How the structure assembles over the reveal window:
 * - layer: discrete block layers along an axis pop in one plane at a time.
 * - scan: a continuous plane sweeps across the structure along an axis.
 * - radial: blocks reveal by distance from an anchor, growing outward (or in).
 * - scatter: a seeded, coordinate-addressed pseudo-random assembly.
 */
export type BuildRevealStrategy =
  | { kind: "layer"; axis: BuildAxis; direction: BuildDirection }
  | { kind: "scan"; axis: BuildAxis; direction: BuildDirection }
  | { kind: "radial"; origin: readonly [number, number, number]; direction: BuildDirection }
  | { kind: "scatter"; seed: number };

export interface BuildSequenceSettings {
  strategy: BuildRevealStrategy;
  startFrame: number;
  /** Frames over which every block reveals. 0 reveals the whole build at once. */
  durationFrames: number;
  /** Per-block fade-in length in frames (>= 0). 0 is an instant block pop. */
  fadeFrames?: number;
}

/** A minimal structural block position; MinecraftBlockSample satisfies it. */
export interface BuildBlockPoint {
  x: number;
  y: number;
  z: number;
}

export interface BuildSchedule {
  /** Reveal frame per input block, aligned to the input array order. */
  revealFrames: number[];
  strategy: BuildRevealStrategy;
  startFrame: number;
  /** Frame at which the last block starts revealing. */
  lastRevealFrame: number;
  /** Frame at which every block is fully opaque (lastRevealFrame + fadeFrames). */
  completeFrame: number;
  fadeFrames: number;
  blockCount: number;
  /** Number of distinct reveal moments (e.g. layer count for the layer strategy). */
  distinctSteps: number;
  warnings: string[];
}

export const BUILD_SEQUENCER_MAX_BLOCKS = 65_536;
