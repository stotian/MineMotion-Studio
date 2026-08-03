import { describe, expect, it } from "vitest";
import type { ImportedWorldSummary } from "../../project/ProjectFile";
import {
  addWorldPropBlock,
  addWorldSceneMarker,
  hideChunksInSelection,
  showAllWorldChunks,
  withWorldSceneOverridesDefaults
} from "./WorldSceneOverrides";

const selection = {
  dimension: "overworld" as const,
  centerChunkX: 0,
  centerChunkZ: 0,
  radiusChunks: 0,
  maxChunks: 8,
  maxRegionFiles: 1,
  maxVerticalSections: 24
};

const world = {
  sourceName: "Read only world",
  levelDatFound: true,
  dimensions: [],
  importedChunks: [{
    id: "overworld:0,0",
    dimension: "overworld" as const,
    regionX: 0,
    regionZ: 0,
    chunkX: 0,
    chunkZ: 0,
    minY: -64,
    maxY: 319,
    sectionsRead: 1,
    blocks: [{ id: "stone" as const, minecraftName: "minecraft:stone", x: 8, y: 70, z: 8 }],
    unknownBlocks: {},
    warnings: []
  }],
  importedAt: "2026-07-29T00:00:00.000Z",
  notes: []
} satisfies ImportedWorldSummary;

describe("WorldSceneOverrides", () => {
  it("hides selected chunks without mutating imported source chunks", () => {
    const overrides = hideChunksInSelection(
      withWorldSceneOverridesDefaults(undefined),
      world.importedChunks ?? [],
      selection
    );

    expect(overrides.hiddenChunkIds).toEqual(["overworld:0,0"]);
    expect(world.importedChunks).toHaveLength(1);
    expect(showAllWorldChunks(overrides).hiddenChunkIds).toEqual([]);
  });

  it("places deterministic scene-only markers and props above terrain", () => {
    const markerOverrides = addWorldSceneMarker(
      withWorldSceneOverridesDefaults(undefined),
      world,
      selection,
      "anchor"
    );
    const propOverrides = addWorldPropBlock(markerOverrides, world, selection, "glowstone");

    expect(markerOverrides.markers[0].position).toEqual([8, 71, 8]);
    expect(propOverrides.propBlocks[0].position).toEqual([8, 71.5, 8]);
    expect(propOverrides.propBlocks[0].blockId).toBe("glowstone");
  });
});
