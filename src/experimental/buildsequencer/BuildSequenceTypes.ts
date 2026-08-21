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

/**
 * Cinematic pacing of the reveal over time. It warps *when* blocks appear while
 * preserving their order: a timelapse that eases in starts slow and accelerates,
 * ease-out finishes with a settle, ease-in-out does both. Defaults to linear.
 */
export type BuildPacing = "linear" | "ease-in" | "ease-out" | "ease-in-out";

/**
 * "assemble" reveals the build block-by-block (a construction timelapse).
 * "disassemble" starts from the finished build and takes it apart in the same
 * order (a deconstruction / dissolve shot). Defaults to "assemble".
 */
export type BuildMode = "assemble" | "disassemble";

export interface BuildSequenceSettings {
  strategy: BuildRevealStrategy;
  startFrame: number;
  /** Frames over which every block reveals. 0 reveals the whole build at once. */
  durationFrames: number;
  /** Per-block fade length in frames (>= 0). 0 is an instant block pop. */
  fadeFrames?: number;
  /** Cinematic acceleration of the reveal. Defaults to "linear". */
  pacing?: BuildPacing;
  /** Assemble (build up) or disassemble (take apart). Defaults to "assemble". */
  mode?: BuildMode;
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
  mode: BuildMode;
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
