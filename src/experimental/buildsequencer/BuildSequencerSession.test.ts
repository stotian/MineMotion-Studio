import { describe, expect, it } from "vitest";
import { createInitialProject } from "../../project/ProjectStore";
import type { ImportedWorldSummary, MineMotionProject } from "../../project/ProjectFile";
import type { MinecraftBlockSample } from "../../minecraft/import/MinecraftChunkTypes";
import {
  deriveBuildSequence,
  revealedBlocksAtFrame,
  revealedWorldBlockCount
} from "./BuildSequencerSession";
import { BUILD_SEQUENCER_MAX_BLOCKS, type BuildSequenceSettings } from "./BuildSequenceTypes";

function block(x: number, y: number, z: number): MinecraftBlockSample {
  return { id: "stone", minecraftName: "minecraft:stone", x, y, z };
}

function worldWith(blockGroups: MinecraftBlockSample[][]): ImportedWorldSummary {
  return {
    sourceName: "Build Sequencer World",
    levelDatFound: true,
    dimensions: [{ id: "overworld", label: "Overworld", regionFiles: ["region/r.0.0.mca"] }],
    selectedDimension: "overworld",
    importedChunks: blockGroups.map((blocks, index) => ({
      id: `overworld:0,${index}`,
      dimension: "overworld" as const,
      regionX: 0,
      regionZ: 0,
      chunkX: 0,
      chunkZ: index,
      minY: -64,
      maxY: 319,
      sectionsRead: 1,
      blocks,
      unknownBlocks: {},
      warnings: [],
      contentFingerprint: `chunk-${index}`
    })),
    importedAt: "2026-08-21T00:00:00.000Z",
    notes: []
  };
}

function projectWithWorld(world: ImportedWorldSummary | null): MineMotionProject {
  return { ...createInitialProject(), world };
}

const SETTINGS: BuildSequenceSettings = {
  strategy: { kind: "layer", axis: "y", direction: "ascending" },
  startFrame: 0,
  durationFrames: 60,
  fadeFrames: 0
};

describe("BuildSequencerSession project integration", () => {
  it("derives a reveal over the imported world blocks across chunks", () => {
    const world = worldWith([
      [block(0, 0, 0), block(1, 0, 0)],
      [block(0, 1, 1), block(1, 2, 1)]
    ]);
    const view = deriveBuildSequence(projectWithWorld(world), SETTINGS);

    expect(view.sourceChunkCount).toBe(2);
    expect(view.totalWorldBlocks).toBe(4);
    expect(view.blocks).toHaveLength(4);
    expect(view.schedule.blockCount).toBe(4);
    expect(view.warnings).toEqual([]);

    // Monotonic reveal that completes by the schedule's end.
    expect(revealedWorldBlockCount(view, view.schedule.startFrame - 1)).toBe(0);
    expect(revealedWorldBlockCount(view, view.schedule.completeFrame)).toBe(4);
    expect(revealedBlocksAtFrame(view, view.schedule.completeFrame)).toHaveLength(4);
    let previous = 0;
    for (let frame = -1; frame <= view.schedule.completeFrame; frame += 1) {
      const count = revealedWorldBlockCount(view, frame);
      expect(count).toBeGreaterThanOrEqual(previous);
      previous = count;
    }
  });

  it("returns only the blocks revealed so far at a mid frame", () => {
    const world = worldWith([[block(0, 0, 0), block(0, 5, 0), block(0, 10, 0)]]);
    const view = deriveBuildSequence(projectWithWorld(world), { ...SETTINGS, durationFrames: 20 });
    const revealed = revealedBlocksAtFrame(view, view.schedule.startFrame);
    // Only the bottom layer (y=0) is revealed at the very first frame.
    expect(revealed).toEqual([{ x: 0, y: 0, z: 0 }]);
  });

  it("warns and yields an empty schedule when no world is imported", () => {
    const view = deriveBuildSequence(projectWithWorld(null), SETTINGS);
    expect(view.totalWorldBlocks).toBe(0);
    expect(view.schedule.blockCount).toBe(0);
    expect(view.warnings).toContain("No Minecraft world is imported.");
  });

  it("warns when the imported world has no blocks", () => {
    const view = deriveBuildSequence(projectWithWorld(worldWith([[]])), SETTINGS);
    expect(view.totalWorldBlocks).toBe(0);
    expect(view.warnings).toContain("The imported world has no blocks to reveal.");
  });

  it("degrades gracefully to a deterministic subset above the safety cap", () => {
    const overflow: MinecraftBlockSample[] = [];
    for (let i = 0; i <= BUILD_SEQUENCER_MAX_BLOCKS; i += 1) overflow.push(block(i, i % 7, 0));
    const project = projectWithWorld(worldWith([overflow]));
    const first = deriveBuildSequence(project, SETTINGS);
    const again = deriveBuildSequence(project, SETTINGS);

    expect(first.totalWorldBlocks).toBe(BUILD_SEQUENCER_MAX_BLOCKS + 1);
    expect(first.blocks).toHaveLength(BUILD_SEQUENCER_MAX_BLOCKS);
    expect(first.warnings.some((w) => /limited to the first/i.test(w))).toBe(true);
    // Deterministic across calls.
    expect(again.blocks).toEqual(first.blocks);
  });

  it("is fully deterministic for a given world and settings", () => {
    const world = worldWith([[block(2, 0, 1), block(0, 3, 2), block(1, 1, 0)]]);
    const scatter: BuildSequenceSettings = { strategy: { kind: "scatter", seed: 99 }, startFrame: 5, durationFrames: 40 };
    expect(deriveBuildSequence(projectWithWorld(world), scatter).schedule).toEqual(
      deriveBuildSequence(projectWithWorld(world), scatter).schedule
    );
  });
});
