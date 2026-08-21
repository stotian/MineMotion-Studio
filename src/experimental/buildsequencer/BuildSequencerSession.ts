import type { MineMotionProject } from "../../project/ProjectFile";
import { buildBuildSchedule, revealedBlockCount } from "./BuildSequencer";
import {
  BUILD_SEQUENCER_MAX_BLOCKS,
  type BuildBlockPoint,
  type BuildSchedule,
  type BuildSequenceSettings
} from "./BuildSequenceTypes";

// Project integration for the experimental Build Sequencer. It derives a reveal
// view from a project's imported Minecraft world blocks without persisting any
// state, mirroring the motion-path/foot-lock derived-view precedent (TD-035).

export interface BuildSequenceView {
  schedule: BuildSchedule;
  /** Source block positions, aligned to schedule.revealFrames. */
  blocks: BuildBlockPoint[];
  sourceChunkCount: number;
  /** Blocks discovered in the world before the safety cap. */
  totalWorldBlocks: number;
  warnings: string[];
}

/**
 * Build a reveal view over the project's imported world blocks. Worlds larger
 * than the safety cap are reduced to a deterministic spatial subset (stable
 * bottom-up order) and reported, so the feature degrades gracefully instead of
 * failing on a large import.
 */
export function deriveBuildSequence(
  project: MineMotionProject,
  settings: BuildSequenceSettings
): BuildSequenceView {
  const chunks = project.world?.importedChunks ?? [];
  const warnings: string[] = [];
  const all: BuildBlockPoint[] = [];
  for (const chunk of chunks) {
    for (const block of chunk.blocks) {
      all.push({ x: block.x, y: block.y, z: block.z });
    }
  }

  if (all.length === 0) {
    warnings.push(project.world ? "The imported world has no blocks to reveal." : "No Minecraft world is imported.");
  }

  let blocks = all;
  if (all.length > BUILD_SEQUENCER_MAX_BLOCKS) {
    // Deterministic bottom-up spatial order so the retained subset is stable and
    // the reveal still reads as a coherent build.
    blocks = [...all]
      .sort((a, b) => a.y - b.y || a.x - b.x || a.z - b.z)
      .slice(0, BUILD_SEQUENCER_MAX_BLOCKS);
    warnings.push(
      `Build reveal limited to the first ${BUILD_SEQUENCER_MAX_BLOCKS} of ${all.length} world blocks.`
    );
  }

  const schedule = buildBuildSchedule(blocks, settings);
  return {
    schedule,
    blocks,
    sourceChunkCount: chunks.length,
    totalWorldBlocks: all.length,
    warnings: [...warnings, ...schedule.warnings]
  };
}

/** The block positions shown at `frame` (mode-aware). */
export function revealedBlocksAtFrame(view: BuildSequenceView, frame: number): BuildBlockPoint[] {
  const revealed: BuildBlockPoint[] = [];
  const disassemble = view.schedule.mode === "disassemble";
  view.schedule.revealFrames.forEach((revealFrame, index) => {
    if (disassemble ? frame < revealFrame : frame >= revealFrame) revealed.push(view.blocks[index]);
  });
  return revealed;
}

/** How many world blocks are revealed at `frame`. */
export function revealedWorldBlockCount(view: BuildSequenceView, frame: number): number {
  return revealedBlockCount(view.schedule, frame);
}
