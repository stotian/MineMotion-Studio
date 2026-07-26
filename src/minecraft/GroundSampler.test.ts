import { describe, expect, it } from "vitest";
import { createInitialProject } from "../project/ProjectStore";
import type { ImportedChunkData } from "./import/MinecraftChunkTypes";
import { createProjectGroundSampler } from "./GroundSampler";

function importedChunk(blocks: ImportedChunkData["blocks"]): ImportedChunkData {
  return {
    id: "overworld:0,0",
    dimension: "overworld",
    regionX: 0,
    regionZ: 0,
    chunkX: 0,
    chunkZ: 0,
    minY: -64,
    maxY: 320,
    sectionsRead: 1,
    blocks,
    unknownBlocks: {},
    warnings: []
  };
}

describe("project ground sampler", () => {
  it("samples preset cube surfaces using the renderer's centered columns", () => {
    const project = createInitialProject();
    project.projectSettings.terrainPreset = "flat";
    const sampler = createProjectGroundSampler(project);
    expect(sampler.sample([0, 1, 0])).toMatchObject({
      hit: true,
      height: 2,
      blockId: "grass",
      blockPosition: [0, 1, 0],
      source: "terrain-preset"
    });
    expect(sampler.sample([8.49, 2, 8.49]).hit).toBe(true);
    expect(sampler.sample([8.51, 2, 8.51])).toMatchObject({
      hit: false,
      warning: "GROUND_SURFACE_NOT_FOUND"
    });
  });

  it("uses imported block origins, ignores water, and picks the highest bounded support", () => {
    const project = createInitialProject();
    project.projectSettings.terrainPreset = "flat";
    project.world = {
      sourceName: "Ground Test",
      levelDatFound: true,
      dimensions: [],
      importedAt: "2026-07-26T00:00:00.000Z",
      notes: [],
      importedChunks: [importedChunk([
        { id: "stone", minecraftName: "minecraft:stone", x: 2, y: 4, z: -3 },
        { id: "water", minecraftName: "minecraft:water", x: 2, y: 8, z: -3 },
        { id: "glass", minecraftName: "minecraft:glass", x: 2, y: 10, z: -3 }
      ])]
    };
    const sampler = createProjectGroundSampler(project);
    expect(sampler.sample([2.75, 7, -2.1])).toMatchObject({
      hit: true,
      height: 11,
      blockId: "glass",
      source: "imported-world"
    });
    expect(sampler.sample([2.75, 7, -2.1], { maximumRise: 2 })).toMatchObject({
      hit: true,
      height: 5,
      blockId: "stone"
    });
  });

  it("is deterministic across imported chunk and block order", () => {
    const project = createInitialProject();
    const first = importedChunk([
      { id: "dirt", minecraftName: "minecraft:dirt", x: 0, y: 0, z: 0 },
      { id: "grass", minecraftName: "minecraft:grass_block", x: 0, y: 1, z: 0 }
    ]);
    const second = importedChunk([
      { id: "stone", minecraftName: "minecraft:stone", x: 1, y: 4, z: 0 }
    ]);
    project.world = {
      sourceName: "Order Test",
      levelDatFound: true,
      dimensions: [],
      importedAt: "2026-07-26T00:00:00.000Z",
      notes: [],
      importedChunks: [first, second]
    };
    const a = createProjectGroundSampler(project).sample([0.2, 2, 0.2]);
    project.world.importedChunks = [
      { ...second, blocks: [...second.blocks].reverse() },
      { ...first, blocks: [...first.blocks].reverse() }
    ];
    const b = createProjectGroundSampler(project).sample([0.2, 2, 0.2]);
    expect(b).toEqual(a);
  });

  it("fails closed for absent terrain and invalid coordinates", () => {
    const project = createInitialProject();
    project.projectSettings.terrainPreset = "none";
    const sampler = createProjectGroundSampler(project);
    expect(sampler.sample([0, 0, 0])).toMatchObject({
      hit: false,
      source: null,
      warning: "GROUND_SURFACE_NOT_FOUND"
    });
    expect(sampler.sample([Number.NaN, 0, 0])).toMatchObject({
      hit: false,
      warning: "GROUND_QUERY_INVALID"
    });
  });
});
