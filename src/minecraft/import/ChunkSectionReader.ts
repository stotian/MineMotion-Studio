import { BlockStateDecoder } from "./BlockStateDecoder";
import type { MinecraftBlockSample } from "./MinecraftChunkTypes";
import {
  compoundValue,
  tagNumber,
  type NbtCompound
} from "./NbtTypes";

export interface ChunkSectionReadResult {
  blocks: MinecraftBlockSample[];
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
    if (sectionY === undefined) {
      return {
        blocks: [],
        unknownBlocks: {},
        warnings: ["Chunk section is missing Y coordinate."]
      };
    }

    const decoded = BlockStateDecoder.decodeSection({
      sectionY,
      chunkX: options.chunkX,
      chunkZ: options.chunkZ,
      section: options.section
    });

    return {
      ...decoded,
      warnings: []
    };
  }
}
