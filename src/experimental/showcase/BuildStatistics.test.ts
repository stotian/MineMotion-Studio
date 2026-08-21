import { describe, expect, it } from "vitest";
import { createInitialProject } from "../../project/ProjectStore";
import type { ImportedWorldSummary, MineMotionProject } from "../../project/ProjectFile";
import type { MinecraftBlockSample } from "../../minecraft/import/MinecraftChunkTypes";
import { computeBuildStatistics } from "./BuildStatistics";

function block(id: MinecraftBlockSample["id"], x: number, y: number, z: number): MinecraftBlockSample {
  return { id, minecraftName: `minecraft:${id}`, x, y, z };
}

function withWorld(blocks: MinecraftBlockSample[]): MineMotionProject {
  const world: ImportedWorldSummary = {
    sourceName: "W", levelDatFound: true,
    dimensions: [{ id: "overworld", label: "Overworld", regionFiles: ["region/r.0.0.mca"] }],
    selectedDimension: "overworld",
    importedChunks: [{
      id: "overworld:0,0", dimension: "overworld", regionX: 0, regionZ: 0, chunkX: 0, chunkZ: 0,
      minY: -64, maxY: 319, sectionsRead: 1, blocks, unknownBlocks: {}, warnings: [], contentFingerprint: "c0"
    }],
    importedAt: "2026-08-21T00:00:00.000Z", notes: []
  };
  return { ...createInitialProject(), world };
}

describe("computeBuildStatistics", () => {
  it("counts blocks, types and footprint dimensions", () => {
    const stats = computeBuildStatistics(withWorld([
      block("stone", 0, 0, 0),
      block("stone", 1, 0, 0),
      block("stone", 2, 0, 0),
      block("grass_block", 0, 1, 0),
      block("dirt", 0, 0, 3)
    ]));

    expect(stats.totalBlocks).toBe(5);
    expect(stats.uniqueBlockTypes).toBe(3);
    // Sorted by descending count: stone (3) first.
    expect(stats.countsByType[0]).toEqual({ id: "stone", count: 3 });
    expect(stats.dimensions).toEqual({ width: 3, height: 2, depth: 4 });
  });

  it("returns an empty summary without a world", () => {
    const stats = computeBuildStatistics(createInitialProject());
    expect(stats.totalBlocks).toBe(0);
    expect(stats.countsByType).toEqual([]);
    expect(stats.dimensions).toEqual({ width: 0, height: 0, depth: 0 });
  });

  it("breaks count ties deterministically by id", () => {
    const stats = computeBuildStatistics(withWorld([
      block("dirt", 0, 0, 0),
      block("stone", 1, 0, 0)
    ]));
    expect(stats.countsByType.map((entry) => entry.id)).toEqual(["dirt", "stone"]);
  });
});
