import { describe, expect, it } from "vitest";
import { BlockStateDecoder, mapMinecraftBlockName } from "./BlockStateDecoder";
import type { NbtCompound } from "./NbtTypes";

describe("BlockStateDecoder", () => {
  it("maps supported and unknown Minecraft blocks", () => {
    expect(mapMinecraftBlockName("minecraft:grass_block")).toBe("grass_block");
    expect(mapMinecraftBlockName("minecraft:diamond_ore")).toBe("ore");
    expect(mapMinecraftBlockName("minecraft:not_real")).toBe("unknown");
  });

  it("decodes a single-palette chunk section", () => {
    const section: NbtCompound = {
      Y: { type: "byte", name: "Y", value: 0 },
      block_states: {
        type: "compound",
        name: "block_states",
        value: {
          palette: {
            type: "list",
            name: "palette",
            value: [
              {
                Name: {
                  type: "string",
                  name: "Name",
                  value: "minecraft:stone"
                }
              }
            ]
          }
        }
      }
    };

    const decoded = BlockStateDecoder.decodeSection({
      sectionY: 0,
      chunkX: 2,
      chunkZ: -1,
      section
    });

    expect(decoded.blocks).toHaveLength(4096);
    expect(decoded.blocks[0]).toMatchObject({
      id: "stone",
      x: 32,
      y: 0,
      z: -16
    });
  });
});
