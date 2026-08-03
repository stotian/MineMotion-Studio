import {
  asCompound,
  compoundValue,
  tagBigIntArray,
  tagList,
  tagNumber,
  tagNumberArray,
  tagString,
  type NbtCompound,
  type NbtTag
} from "./NbtTypes";
import { ChunkSectionReader } from "./ChunkSectionReader";
import type {
  ImportedChunkData,
  MinecraftDimensionId
} from "./MinecraftChunkTypes";

export class ChunkReader {
  static readChunk(options: {
    tag: NbtTag;
    dimension: MinecraftDimensionId;
    fallbackChunkX: number;
    fallbackChunkZ: number;
    regionX: number;
    regionZ: number;
    maxVerticalSections: number;
  }): ImportedChunkData {
    const root = asCompound(options.tag);
    const level = root ? (asCompound(compoundValue(root, "Level")) ?? root) : {};
    const chunkX = finiteInteger(
      tagNumber(compoundValue(level, "xPos")),
      options.fallbackChunkX
    );
    const chunkZ = finiteInteger(
      tagNumber(compoundValue(level, "zPos")),
      options.fallbackChunkZ
    );
    const sectionTag =
      compoundValue(level, "sections") ?? compoundValue(level, "Sections");
    const sections = tagList<NbtCompound>(sectionTag) ?? [];
    const maxVerticalSections = boundedPositiveInteger(
      options.maxVerticalSections
    );
    const warnings: string[] = [];
    const blocks: ImportedChunkData["blocks"] = [];
    const unknownBlocks: Record<string, number> = {};
    const biomePalette = new Set<string>();
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    if (sections.length === 0) {
      warnings.push("Chunk has no readable block sections.");
    }

    for (const section of sections.slice(0, maxVerticalSections)) {
      const result = ChunkSectionReader.read({
        chunkX,
        chunkZ,
        section
      });
      blocks.push(...result.blocks);
      result.biomePalette.forEach((biome) => biomePalette.add(biome));
      if (result.minY !== null && result.maxY !== null) {
        minY = Math.min(minY, result.minY);
        maxY = Math.max(maxY, result.maxY);
      }
      for (const [name, count] of Object.entries(result.unknownBlocks)) {
        unknownBlocks[name] = (unknownBlocks[name] ?? 0) + count;
      }
      warnings.push(...result.warnings);
    }

    if (sections.length > maxVerticalSections) {
      warnings.push(
        `Skipped ${sections.length - maxVerticalSections} vertical sections due to import limits.`
      );
    }

    const dataVersion = tagNumber(
      compoundValue(root ?? level, "DataVersion") ??
      compoundValue(level, "DataVersion")
    );
    const status =
      tagString(compoundValue(level, "Status")) ??
      tagString(compoundValue(level, "status"));
    const legacyBiomeIds = tagNumberArray(
      compoundValue(level, "Biomes") ?? compoundValue(level, "biomes")
    );
    const heightmaps = readHeightmaps(level);

    return {
      id: `${options.dimension}:${chunkX},${chunkZ}`,
      dimension: options.dimension,
      regionX: options.regionX,
      regionZ: options.regionZ,
      chunkX,
      chunkZ,
      minY: Number.isFinite(minY) ? minY : 0,
      maxY: Number.isFinite(maxY) ? maxY : 0,
      sectionsRead: Math.min(sections.length, maxVerticalSections),
      blocks,
      unknownBlocks,
      warnings,
      ...(dataVersion !== undefined ? { dataVersion } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(biomePalette.size > 0 ? { biomePalette: [...biomePalette].sort() } : {}),
      ...(legacyBiomeIds ? { legacyBiomeIds: [...legacyBiomeIds] } : {}),
      ...(Object.keys(heightmaps).length > 0 ? { heightmaps } : {})
    };
  }
}

function readHeightmaps(level: NbtCompound): Record<string, number[]> {
  const compound = asCompound(
    compoundValue(level, "Heightmaps") ?? compoundValue(level, "heightmaps")
  );
  if (!compound) return {};
  const result: Record<string, number[]> = {};
  for (const [name, tag] of Object.entries(compound)) {
    const packed = tagBigIntArray(tag);
    if (!packed || packed.length === 0 || packed.length > 64) continue;
    const decoded = decodeDenseValues(packed, 256);
    if (decoded) result[name] = decoded;
  }
  return result;
}

function decodeDenseValues(packed: bigint[], valueCount: number): number[] | null {
  const bitsPerValue = Math.floor((packed.length * 64) / valueCount);
  if (bitsPerValue < 1 || bitsPerValue > 32) return null;
  if (Math.ceil((valueCount * bitsPerValue) / 64) !== packed.length) return null;
  const mask = (1n << BigInt(bitsPerValue)) - 1n;
  const result: number[] = [];
  for (let index = 0; index < valueCount; index += 1) {
    const bitIndex = index * bitsPerValue;
    const longIndex = Math.floor(bitIndex / 64);
    const startBit = bitIndex % 64;
    const current = BigInt.asUintN(64, packed[longIndex] ?? 0n);
    if (startBit + bitsPerValue <= 64) {
      result.push(Number((current >> BigInt(startBit)) & mask));
      continue;
    }
    const next = BigInt.asUintN(64, packed[longIndex + 1] ?? 0n);
    const combined = current | (next << 64n);
    result.push(Number((combined >> BigInt(startBit)) & mask));
  }
  return result;
}

function finiteInteger(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value)
    ? Math.trunc(value)
    : Math.trunc(fallback);
}

function boundedPositiveInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}
