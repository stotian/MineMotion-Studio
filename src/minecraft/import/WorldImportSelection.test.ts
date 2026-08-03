import { describe, expect, it } from "vitest";
import type { MinecraftDimensionScan } from "./MinecraftChunkTypes";
import { DEFAULT_WORLD_IMPORT_OPTIONS } from "./WorldImportManager";
import {
  centerChunkForRegion,
  createWorldImportRequestEstimate,
  createWorldSelectionPreview,
  selectWorldChunkLocations,
  selectWorldRegionFiles
} from "./WorldImportSelection";

function dimension(): MinecraftDimensionScan {
  const file = new File([], "r.0.0.mca");
  return {
    id: "overworld",
    label: "Overworld",
    estimatedChunks: 3072,
    regionFiles: [
      { path: "r.-1.0.mca", file, dimension: "overworld", regionX: -1, regionZ: 0, chunkLocations: 0, estimatedChunks: 1024 },
      { path: "r.0.0.mca", file, dimension: "overworld", regionX: 0, regionZ: 0, chunkLocations: 0, estimatedChunks: 1024 },
      { path: "r.4.4.mca", file, dimension: "overworld", regionX: 4, regionZ: 4, chunkLocations: 0, estimatedChunks: 1024 }
    ]
  };
}

describe("world import selection", () => {
  it("orders bounded regions and chunks deterministically across negative coordinates", () => {
    const options = {
      ...DEFAULT_WORLD_IMPORT_OPTIONS,
      centerChunkX: -1,
      centerChunkZ: 0,
      radiusChunks: 2,
      maxChunks: 2,
      maxRegionFiles: 2
    };
    expect(selectWorldRegionFiles(dimension().regionFiles, options).map((item) => item.path)).toEqual([
      "r.-1.0.mca",
      "r.0.0.mca"
    ]);
    expect(selectWorldChunkLocations([
      { localX: 0, localZ: 0, chunkX: -3, chunkZ: 0, offsetSector: 2, sectorCount: 1, timestamp: 0 },
      { localX: 1, localZ: 0, chunkX: -1, chunkZ: 0, offsetSector: 3, sectorCount: 1, timestamp: 0 },
      { localX: 2, localZ: 0, chunkX: 0, chunkZ: 0, offsetSector: 4, sectorCount: 1, timestamp: 0 }
    ], options).map((item) => item.chunkX)).toEqual([-1, 0]);
  });

  it("creates a bounded top-down preview and conservative request estimate", () => {
    const options = {
      ...DEFAULT_WORLD_IMPORT_OPTIONS,
      centerChunkX: -1,
      centerChunkZ: 0,
      radiusChunks: 12,
      maxChunks: 16,
      maxRegionFiles: 2,
      maxVerticalSections: 24
    };
    const preview = createWorldSelectionPreview(dimension(), options);
    expect(preview).toMatchObject({ radius: 8, clipped: true, sideLength: 17 });
    expect(preview.cells).toHaveLength(289);
    expect(preview.cells.find((cell) => cell.center)).toMatchObject({
      chunkX: -1,
      chunkZ: 0,
      regionX: -1,
      regionZ: 0,
      sourceRegionAvailable: true
    });
    expect(createWorldImportRequestEstimate(dimension(), options)).toEqual({
      selectedRegionFiles: 2,
      requestedAreaChunks: 625,
      boundedChunkCandidates: 16,
      maximumDecodedBlocks: 1_572_864,
      maximumEstimatedMemoryBytes: 31_457_280
    });
  });

  it("centers region selection on its chunk midpoint", () => {
    expect(centerChunkForRegion(-2, 3)).toEqual({
      centerChunkX: -48,
      centerChunkZ: 112
    });
  });
});
