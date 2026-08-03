import { describe, expect, it } from "vitest";
import { ChunkReader } from "./ChunkReader";
import type { NbtCompound, NbtTag } from "./NbtTypes";

function airSection(y: number): NbtCompound {
  return {
    Y: { type: "byte", name: "Y", value: y },
    block_states: {
      type: "compound",
      name: "block_states",
      value: {
        palette: {
          type: "list",
          name: "palette",
          value: [{ Name: { type: "string", name: "Name", value: "minecraft:air" } }]
        }
      }
    },
    biomes: {
      type: "compound",
      name: "biomes",
      value: {
        palette: {
          type: "list",
          name: "palette",
          value: [y < 0 ? "minecraft:deep_dark" : "minecraft:plains"]
        }
      }
    }
  };
}

describe("ChunkReader modern height metadata", () => {
  it("uses signed section bounds even when sections contain only air", () => {
    const root: NbtTag = {
      type: "compound",
      name: "",
      value: {
        DataVersion: { type: "int", name: "DataVersion", value: 3955 },
        xPos: { type: "int", name: "xPos", value: -33 },
        zPos: { type: "int", name: "zPos", value: 64 },
        Status: { type: "string", name: "Status", value: "minecraft:full" },
        sections: {
          type: "list",
          name: "sections",
          value: [airSection(-4), airSection(19)]
        },
        Heightmaps: {
          type: "compound",
          name: "Heightmaps",
          value: {
            WORLD_SURFACE: {
              type: "longArray",
              name: "WORLD_SURFACE",
              value: Array.from({ length: 36 }, () => 0n)
            }
          }
        }
      }
    };

    expect(ChunkReader.readChunk({
      tag: root,
      dimension: "overworld",
      fallbackChunkX: 0,
      fallbackChunkZ: 0,
      regionX: -2,
      regionZ: 2,
      maxVerticalSections: 24
    })).toMatchObject({
      id: "overworld:-33,64",
      chunkX: -33,
      chunkZ: 64,
      minY: -64,
      maxY: 319,
      sectionsRead: 2,
      blocks: [],
      dataVersion: 3955,
      status: "minecraft:full",
      biomePalette: ["minecraft:deep_dark", "minecraft:plains"]
    });
    const chunk = ChunkReader.readChunk({
      tag: root,
      dimension: "overworld",
      fallbackChunkX: 0,
      fallbackChunkZ: 0,
      regionX: -2,
      regionZ: 2,
      maxVerticalSections: Number.NaN
    });
    expect(chunk.sectionsRead).toBe(1);
    expect(chunk.heightmaps?.WORLD_SURFACE).toHaveLength(256);
    expect(chunk.heightmaps?.WORLD_SURFACE.every((value) => value === 0)).toBe(true);
  });
});
