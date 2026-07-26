import { ChunkReader } from "./ChunkReader";
import { decompressMcaPayload } from "./AnvilRegionReader";
import { NbtReader } from "./NbtReader";
import type {
  ImportedChunkData,
  MinecraftDimensionId
} from "./MinecraftChunkTypes";

export interface WorldChunkDecodeRequest {
  compressedData: Uint8Array;
  compressionType: number;
  dimension: MinecraftDimensionId;
  fallbackChunkX: number;
  fallbackChunkZ: number;
  regionX: number;
  regionZ: number;
  maxVerticalSections: number;
}

export async function decodeWorldChunk(
  request: WorldChunkDecodeRequest
): Promise<ImportedChunkData> {
  const decompressed = await decompressMcaPayload(
    request.compressedData,
    request.compressionType
  );
  const tag = NbtReader.parseUncompressed(decompressed);
  return ChunkReader.readChunk({
    tag,
    dimension: request.dimension,
    fallbackChunkX: request.fallbackChunkX,
    fallbackChunkZ: request.fallbackChunkZ,
    regionX: request.regionX,
    regionZ: request.regionZ,
    maxVerticalSections: request.maxVerticalSections
  });
}
