import type { BlockId } from "../MinecraftWorldTypes";
import type { MinecraftBlockSample } from "./MinecraftChunkTypes";
import {
  asCompound,
  compoundValue,
  tagBigIntArray,
  tagList,
  tagString,
  type NbtCompound
} from "./NbtTypes";

export interface DecodedBlockStates {
  blocks: MinecraftBlockSample[];
  unknownBlocks: Record<string, number>;
  warnings: string[];
}

type PackingLayout = "dense" | "padded";

interface PaletteEntry {
  minecraftName: string;
  stateKey: string;
  properties: Readonly<Record<string, string>>;
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
    const paletteTag =
      compoundValue(blockStates, "palette") ??
      compoundValue(blockStates, "Palette");
    const dataTag =
      compoundValue(blockStates, "data") ??
      compoundValue(blockStates, "BlockStates");
    const paletteCompounds = tagList<NbtCompound>(paletteTag) ?? [];
    const palette = paletteCompounds.map(readPaletteEntry);
    const packed = tagBigIntArray(dataTag);
    const blocks: MinecraftBlockSample[] = [];
    const unknownBlocks: Record<string, number> = {};
    const warnings: string[] = [];

    if (palette.length === 0) {
      warnings.push("Chunk section has no readable block-state palette.");
      return { blocks, unknownBlocks, warnings };
    }
    if (palette.length > 4096) {
      warnings.push(`Chunk section palette has ${palette.length} entries; maximum is 4096.`);
      return { blocks, unknownBlocks, warnings };
    }

    const bitsPerBlock = Math.max(
      4,
      Math.ceil(Math.log2(Math.max(1, palette.length)))
    );
    const mask = (1n << BigInt(bitsPerBlock)) - 1n;
    const layout = palette.length === 1
      ? null
      : detectPackingLayout(packed?.length ?? 0, bitsPerBlock);

    if (palette.length > 1 && !packed) {
      warnings.push("Chunk section has multiple palette entries but no packed block-state data.");
      return { blocks, unknownBlocks, warnings };
    }
    if (palette.length > 1 && !layout) {
      warnings.push(
        `Chunk section block-state data length ${packed?.length ?? 0} does not match dense or padded ${bitsPerBlock}-bit packing.`
      );
      return { blocks, unknownBlocks, warnings };
    }

    let invalidPaletteIndexes = 0;
    for (let index = 0; index < 4096; index += 1) {
      const paletteIndex = palette.length === 1
        ? 0
        : BlockStateDecoder.readPackedValue(
            packed!,
            index,
            bitsPerBlock,
            mask,
            layout!
          );
      const entry = palette[paletteIndex];
      if (!entry) {
        invalidPaletteIndexes += 1;
        continue;
      }
      const blockId = mapMinecraftBlockName(entry.minecraftName);
      if (blockId === "air") continue;
      if (blockId === "unknown") {
        unknownBlocks[entry.stateKey] = (unknownBlocks[entry.stateKey] ?? 0) + 1;
      }

      const localX = index & 15;
      const localZ = (index >> 4) & 15;
      const localY = (index >> 8) & 15;
      blocks.push({
        id: blockId,
        minecraftName: entry.minecraftName,
        stateKey: entry.stateKey,
        properties: entry.properties,
        x: options.chunkX * 16 + localX,
        y: options.sectionY * 16 + localY,
        z: options.chunkZ * 16 + localZ
      });
    }

    if (invalidPaletteIndexes > 0) {
      warnings.push(
        `Skipped ${invalidPaletteIndexes} blocks with out-of-range palette indexes.`
      );
    }
    return { blocks, unknownBlocks, warnings };
  }

  private static readPackedValue(
    packed: bigint[],
    index: number,
    bitsPerBlock: number,
    mask: bigint,
    layout: PackingLayout
  ): number {
    if (layout === "padded") {
      const valuesPerLong = Math.floor(64 / bitsPerBlock);
      const longIndex = Math.floor(index / valuesPerLong);
      const startBit = (index % valuesPerLong) * bitsPerBlock;
      const current = BigInt.asUintN(64, packed[longIndex] ?? 0n);
      return Number((current >> BigInt(startBit)) & mask);
    }

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

export function detectPackingLayout(
  packedLongs: number,
  bitsPerBlock: number
): PackingLayout | null {
  const valuesPerLong = Math.floor(64 / bitsPerBlock);
  const paddedLongs = Math.ceil(4096 / valuesPerLong);
  const denseLongs = Math.ceil((4096 * bitsPerBlock) / 64);
  if (packedLongs === paddedLongs) return "padded";
  if (packedLongs === denseLongs) return "dense";
  return null;
}

function readPaletteEntry(compound: NbtCompound): PaletteEntry {
  const minecraftName =
    tagString(compoundValue(compound, "Name")) ??
    tagString(compoundValue(compound, "name")) ??
    "minecraft:air";
  const propertyCompound =
    asCompound(compoundValue(compound, "Properties")) ??
    asCompound(compoundValue(compound, "properties"));
  const properties = Object.freeze(
    Object.fromEntries(
      Object.entries(propertyCompound ?? {})
        .map(([key, tag]) => [key, tagString(tag)] as const)
        .filter((entry): entry is readonly [string, string] => entry[1] !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
    )
  );
  const stateSuffix = Object.entries(properties)
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
  return {
    minecraftName,
    stateKey: stateSuffix ? `${minecraftName}[${stateSuffix}]` : minecraftName,
    properties
  };
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
  if (normalized.includes("lava")) return "lava";
  if (normalized.includes("glass")) return "glass";
  if (normalized === "glowstone") return "glowstone";
  if (normalized === "torch" || normalized.endsWith("_torch")) return "torch";
  if (normalized === "redstone_lamp") return "redstone_lamp";
  if (normalized === "sand" || normalized === "red_sand") return "sand";
  if (normalized === "gravel") return "gravel";
  if (normalized === "snow" || normalized === "snow_block") return "snow";
  if (normalized === "netherrack") return "netherrack";
  if (normalized === "end_stone") return "end_stone";
  if (normalized.endsWith("_ore") || normalized.includes("ore")) return "ore";
  return "unknown";
}
