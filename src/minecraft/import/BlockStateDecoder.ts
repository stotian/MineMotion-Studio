import type { BlockId } from "../MinecraftWorldTypes";
import type { MinecraftBlockSample } from "./MinecraftChunkTypes";
import {
  asCompound,
  compoundValue,
  tagBigIntArray,
  tagList,
  tagString,
  type NbtCompound,
  type NbtTag
} from "./NbtTypes";

export interface DecodedBlockStates {
  blocks: MinecraftBlockSample[];
  unknownBlocks: Record<string, number>;
}

export class BlockStateDecoder {
  static decodeSection(options: {
    sectionY: number;
    chunkX: number;
    chunkZ: number;
    section: NbtCompound;
  }): DecodedBlockStates {
    const blockStates =
      asCompound(compoundValue(options.section, "block_states")) ??
      options.section;
    const paletteTag = compoundValue(blockStates, "palette") ?? compoundValue(blockStates, "Palette");
    const dataTag = compoundValue(blockStates, "data") ?? compoundValue(blockStates, "BlockStates");
    const paletteCompounds = tagList<NbtCompound>(paletteTag) ?? [];
    const palette = paletteCompounds.map((item) =>
      tagString(compoundValue(item, "Name")) ?? "minecraft:air"
    );
    const packed = tagBigIntArray(dataTag);
    const blocks: MinecraftBlockSample[] = [];
    const unknownBlocks: Record<string, number> = {};

    if (palette.length === 0) {
      return { blocks, unknownBlocks };
    }

    const bitsPerBlock = Math.max(4, Math.ceil(Math.log2(Math.max(1, palette.length))));
    const mask = (1n << BigInt(bitsPerBlock)) - 1n;

    for (let index = 0; index < 4096; index += 1) {
      const paletteIndex =
        !packed || palette.length === 1
          ? 0
          : BlockStateDecoder.readPackedValue(packed, index, bitsPerBlock, mask);
      const minecraftName = palette[paletteIndex] ?? "minecraft:air";
      const blockId = mapMinecraftBlockName(minecraftName);
      if (blockId === "air") continue;
      if (blockId === "unknown") {
        unknownBlocks[minecraftName] = (unknownBlocks[minecraftName] ?? 0) + 1;
      }

      const localX = index & 15;
      const localZ = (index >> 4) & 15;
      const localY = (index >> 8) & 15;
      blocks.push({
        id: blockId === "unknown" ? "unknown" : blockId,
        minecraftName,
        x: options.chunkX * 16 + localX,
        y: options.sectionY * 16 + localY,
        z: options.chunkZ * 16 + localZ
      });
    }

    return { blocks, unknownBlocks };
  }

  private static readPackedValue(
    packed: bigint[],
    index: number,
    bitsPerBlock: number,
    mask: bigint
  ): number {
    const bitIndex = index * bitsPerBlock;
    const longIndex = Math.floor(bitIndex / 64);
    const startBit = bitIndex % 64;
    const current = BigInt.asUintN(64, packed[longIndex] ?? 0n);
    if (startBit + bitsPerBlock <= 64) {
      return Number((current >> BigInt(startBit)) & mask);
    }
    const next = BigInt.asUintN(64, packed[longIndex + 1] ?? 0n);
    const combined = current | (next << 64n);
    return Number((combined >> BigInt(startBit)) & mask);
  }
}

export function mapMinecraftBlockName(name: string): BlockId | "unknown" {
  const normalized = name.replace(/^minecraft:/, "");
  if (normalized === "air" || normalized === "cave_air" || normalized === "void_air") return "air";
  if (normalized === "grass_block") return "grass_block";
  if (normalized === "dirt") return "dirt";
  if (normalized === "stone") return "stone";
  if (normalized === "cobblestone") return "cobblestone";
  if (normalized === "deepslate") return "deepslate";
  if (normalized === "oak_log" || normalized === "oak_wood") return "oak_log";
  if (normalized === "oak_leaves") return "oak_leaves";
  if (normalized.includes("water")) return "water";
  if (normalized.includes("glass")) return "glass";
  if (normalized === "sand" || normalized === "red_sand") return "sand";
  if (normalized === "gravel") return "gravel";
  if (normalized === "snow" || normalized === "snow_block") return "snow";
  if (normalized === "netherrack") return "netherrack";
  if (normalized === "end_stone") return "end_stone";
  if (normalized.endsWith("_ore") || normalized.includes("ore")) return "ore";
  return "unknown";
}
