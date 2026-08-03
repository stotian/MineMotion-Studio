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

function paletteEntry(name: string, properties?: Record<string, string>): NbtCompound {
  return {
    Name: { type: "string", name: "Name", value: name },
    ...(properties
      ? {
          Properties: {
            type: "compound" as const,
            name: "Properties",
            value: Object.fromEntries(
              Object.entries(properties).map(([key, value]) => [
                key,
                { type: "string" as const, name: key, value }
              ])
            )
          }
        }
      : {})
  };
}

function packPadded(values: number[], bits: number): bigint[] {
  const perLong = Math.floor(64 / bits);
  const output = Array.from(
    { length: Math.ceil(values.length / perLong) },
    () => 0n
  );
  values.forEach((value, index) => {
    const longIndex = Math.floor(index / perLong);
    output[longIndex] |= BigInt(value) << BigInt((index % perLong) * bits);
  });
  return output;
}

function packDense(values: number[], bits: number): bigint[] {
  const output = Array.from(
    { length: Math.ceil((values.length * bits) / 64) },
    () => 0n
  );
  values.forEach((value, index) => {
    const bitIndex = index * bits;
    const longIndex = Math.floor(bitIndex / 64);
    const start = bitIndex % 64;
    output[longIndex] |= BigInt(value) << BigInt(start);
    if (start + bits > 64) {
      output[longIndex + 1] |= BigInt(value) >> BigInt(64 - start);
    }
  });
  return output.map((value) => BigInt.asIntN(64, value));
}

it.each([
  ["modern padded", packPadded],
  ["legacy dense", packDense]
])("decodes %s five-bit block-state packing", (_label, pack) => {
  const values = Array.from({ length: 4096 }, () => 0);
  values[12] = 1;
  values[13] = 1;
  const palette = [
    paletteEntry("minecraft:air"),
    paletteEntry("minecraft:oak_log", { axis: "y", waterlogged: "false" }),
    ...Array.from({ length: 15 }, (_, index) =>
      paletteEntry(`minecraft:unused_${index}`)
    )
  ];
  const section: NbtCompound = {
    Y: { type: "byte", name: "Y", value: -4 },
    block_states: {
      type: "compound",
      name: "block_states",
      value: {
        palette: { type: "list", name: "palette", value: palette },
        data: { type: "longArray", name: "data", value: pack(values, 5) }
      }
    }
  };

  const decoded = BlockStateDecoder.decodeSection({
    sectionY: -4,
    chunkX: -2,
    chunkZ: 3,
    section
  });

  expect(decoded.warnings).toEqual([]);
  expect(decoded.blocks).toHaveLength(2);
  expect(decoded.blocks[0]).toMatchObject({
    id: "oak_log",
    x: -20,
    y: -64,
    z: 48,
    stateKey: "minecraft:oak_log[axis=y,waterlogged=false]",
    properties: { axis: "y", waterlogged: "false" }
  });
});

it("isolates malformed packed state data to the affected section", () => {
  const decoded = BlockStateDecoder.decodeSection({
    sectionY: 0,
    chunkX: 0,
    chunkZ: 0,
    section: {
      block_states: {
        type: "compound",
        name: "block_states",
        value: {
          palette: {
            type: "list",
            name: "palette",
            value: [paletteEntry("minecraft:air"), paletteEntry("minecraft:stone")]
          },
          data: { type: "longArray", name: "data", value: [0n] }
        }
      }
    }
  });
  expect(decoded.blocks).toEqual([]);
  expect(decoded.warnings[0]).toContain("does not match dense or padded");
});
