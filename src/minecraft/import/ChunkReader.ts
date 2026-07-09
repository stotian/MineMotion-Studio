import {
  asCompound,
  compoundValue,
  tagList,
  tagNumber,
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
    const chunkX =
      tagNumber(compoundValue(level, "xPos")) ?? options.fallbackChunkX;
    const chunkZ =
      tagNumber(compoundValue(level, "zPos")) ?? options.fallbackChunkZ;
    const sectionTag =
      compoundValue(level, "sections") ?? compoundValue(level, "Sections");
    const sections = tagList<NbtCompound>(sectionTag) ?? [];
    const warnings: string[] = [];
    const blocks: ImportedChunkData["blocks"] = [];
    const unknownBlocks: Record<string, number> = {};
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    if (sections.length === 0) {
      warnings.push("Chunk has no readable block sections.");
    }

    for (const section of sections.slice(0, options.maxVerticalSections)) {
      const result = ChunkSectionReader.read({
        chunkX,
        chunkZ,
        section
      });
      blocks.push(...result.blocks);
      for (const block of result.blocks) {
        minY = Math.min(minY, block.y);
        maxY = Math.max(maxY, block.y);
      }
      for (const [name, count] of Object.entries(result.unknownBlocks)) {
        unknownBlocks[name] = (unknownBlocks[name] ?? 0) + count;
      }
      warnings.push(...result.warnings);
    }

    if (sections.length > options.maxVerticalSections) {
      warnings.push(
        `Skipped ${sections.length - options.maxVerticalSections} vertical sections due to import limits.`
      );
    }

    return {
      id: `${options.dimension}:${chunkX},${chunkZ}`,
      dimension: options.dimension,
      regionX: options.regionX,
      regionZ: options.regionZ,
      chunkX,
      chunkZ,
      minY: Number.isFinite(minY) ? minY : 0,
      maxY: Number.isFinite(maxY) ? maxY : 0,
      sectionsRead: Math.min(sections.length, options.maxVerticalSections),
      blocks,
      unknownBlocks,
      warnings
    };
  }
}
