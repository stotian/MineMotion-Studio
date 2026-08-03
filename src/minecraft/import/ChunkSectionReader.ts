import { BlockStateDecoder } from "./BlockStateDecoder";
import type { MinecraftBlockSample } from "./MinecraftChunkTypes";
import {
  asCompound,
  compoundValue,
  tagList,
  tagNumber,
  type NbtCompound
} from "./NbtTypes";

export interface ChunkSectionReadResult {
  sectionY: number | null;
  minY: number | null;
  maxY: number | null;
  blocks: MinecraftBlockSample[];
  biomePalette: string[];
  unknownBlocks: Record<string, number>;
  warnings: string[];
}

export class ChunkSectionReader {
  static read(options: {
    chunkX: number;
    chunkZ: number;
    section: NbtCompound;
  }): ChunkSectionReadResult {
    const sectionY =
      tagNumber(compoundValue(options.section, "Y")) ??
      tagNumber(compoundValue(options.section, "y"));
    if (sectionY === undefined || !Number.isInteger(sectionY)) {
      return {
        sectionY: null,
        minY: null,
        maxY: null,
        blocks: [],
        biomePalette: [],
        unknownBlocks: {},
        warnings: ["Chunk section is missing a valid integer Y coordinate."]
      };
    }

    const decoded = BlockStateDecoder.decodeSection({
      sectionY,
      chunkX: options.chunkX,
      chunkZ: options.chunkZ,
      section: options.section
    });

    return {
      sectionY,
      minY: sectionY * 16,
      maxY: sectionY * 16 + 15,
      biomePalette: readBiomePalette(options.section),
      ...decoded
    };
  }
}

function readBiomePalette(section: NbtCompound): string[] {
  const biomes = asCompound(compoundValue(section, "biomes"));
  const palette = tagList<unknown>(compoundValue(biomes ?? {}, "palette")) ?? [];
  return [...new Set(palette.filter((value): value is string => typeof value === "string"))];
}
