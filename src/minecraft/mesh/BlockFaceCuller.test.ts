import { describe, expect, it } from "vitest";
import { BlockFaceCuller } from "./BlockFaceCuller";
import type { ImportedChunkData } from "../import/MinecraftChunkTypes";

describe("BlockFaceCuller", () => {
  it("removes fully hidden faces between adjacent blocks", () => {
    const chunk: ImportedChunkData = {
      id: "overworld:0,0",
      dimension: "overworld",
      regionX: 0,
      regionZ: 0,
      chunkX: 0,
      chunkZ: 0,
      minY: 0,
      maxY: 0,
      sectionsRead: 1,
      blocks: [
        { id: "stone", minecraftName: "minecraft:stone", x: 0, y: 0, z: 0 },
        { id: "stone", minecraftName: "minecraft:stone", x: 1, y: 0, z: 0 }
      ],
      unknownBlocks: {},
      warnings: []
    };

    const visible = BlockFaceCuller.visibleBlocks([chunk]);

    expect(visible).toHaveLength(2);
    expect(visible[0].exposedFaces).not.toContain("east");
    expect(visible[1].exposedFaces).not.toContain("west");
  });
});
