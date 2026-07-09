import type { ImportedChunkData } from "../import/MinecraftChunkTypes";
import { BlockFaceCuller } from "./BlockFaceCuller";
import type { VisibleBlockSample } from "./ChunkMeshTypes";

export class GreedyMesher {
  static compactVisibleBlocks(chunks: ImportedChunkData[]): VisibleBlockSample[] {
    return BlockFaceCuller.visibleBlocks(chunks);
  }
}
