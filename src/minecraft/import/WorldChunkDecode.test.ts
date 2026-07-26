import { describe, expect, it } from "vitest";
import {
  decodeWorldChunk,
  type WorldChunkDecodeRequest
} from "./WorldChunkDecode";

export function createMinimalWorldChunkDecodeRequest(): WorldChunkDecodeRequest {
  return {
    compressedData: new Uint8Array([10, 0, 0, 0]),
    compressionType: 3,
    dimension: "overworld",
    fallbackChunkX: 4,
    fallbackChunkZ: -2,
    regionX: 0,
    regionZ: -1,
    maxVerticalSections: 24
  };
}

describe("decodeWorldChunk", () => {
  it("returns structured-clone-safe deterministic chunk data", async () => {
    const first = await decodeWorldChunk(
      createMinimalWorldChunkDecodeRequest()
    );
    const second = await decodeWorldChunk(
      createMinimalWorldChunkDecodeRequest()
    );

    expect(first).toEqual({
      id: "overworld:4,-2",
      dimension: "overworld",
      regionX: 0,
      regionZ: -1,
      chunkX: 4,
      chunkZ: -2,
      minY: 0,
      maxY: 0,
      sectionsRead: 0,
      blocks: [],
      unknownBlocks: {},
      warnings: ["Chunk has no readable block sections."]
    });
    expect(second).toEqual(first);
    expect(structuredClone(first)).toEqual(first);
  });

  it("preserves decoder errors for worker and fallback callers", async () => {
    await expect(
      decodeWorldChunk({
        ...createMinimalWorldChunkDecodeRequest(),
        compressedData: new Uint8Array([99])
      })
    ).rejects.toThrow("Unsupported NBT tag id");
  });
});
