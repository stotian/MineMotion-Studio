import { describe, expect, it } from "vitest";
import { createInitialProject } from "../../project/ProjectStore";
import type { ImportedWorldSummary, MineMotionProject } from "../../project/ProjectFile";
import type { MinecraftBlockSample } from "../../minecraft/import/MinecraftChunkTypes";
import { computeBuildBounds } from "./BuildBounds";

function block(x: number, y: number, z: number): MinecraftBlockSample {
  return { id: "stone", minecraftName: "minecraft:stone", x, y, z };
}

function worldWith(blocks: MinecraftBlockSample[]): ImportedWorldSummary {
  return {
    sourceName: "W", levelDatFound: true,
    dimensions: [{ id: "overworld", label: "Overworld", regionFiles: ["region/r.0.0.mca"] }],
    selectedDimension: "overworld",
    importedChunks: [{
      id: "overworld:0,0", dimension: "overworld", regionX: 0, regionZ: 0, chunkX: 0, chunkZ: 0,
      minY: -64, maxY: 319, sectionsRead: 1, blocks, unknownBlocks: {}, warnings: [], contentFingerprint: "c0"
    }],
    importedAt: "2026-08-21T00:00:00.000Z", notes: []
  };
}

function withWorld(world: ImportedWorldSummary | null): MineMotionProject {
  return { ...createInitialProject(), world };
}

describe("computeBuildBounds", () => {
  it("centres on the imported world blocks and frames them", () => {
    const bounds = computeBuildBounds(withWorld(worldWith([block(0, 0, 0), block(10, 4, 10)])));
    // Block centres span 0.5..10.5 → centre 5.5 on x/z, 2.5 on y.
    expect(bounds.center[0]).toBeCloseTo(5.5, 5);
    expect(bounds.center[1]).toBeCloseTo(2.5, 5);
    expect(bounds.center[2]).toBeCloseTo(5.5, 5);
    expect(bounds.radius).toBeGreaterThan(4);
  });

  it("grows the radius with the build size", () => {
    const small = computeBuildBounds(withWorld(worldWith([block(0, 0, 0), block(2, 0, 2)])));
    const large = computeBuildBounds(withWorld(worldWith([block(0, 0, 0), block(60, 0, 60)])));
    expect(large.radius).toBeGreaterThan(small.radius);
  });

  it("falls back to scene objects, then to a default", () => {
    const scene = computeBuildBounds(withWorld(null));
    expect(scene.center).toBeDefined();
    expect(scene.radius).toBeGreaterThanOrEqual(4);
  });
});
