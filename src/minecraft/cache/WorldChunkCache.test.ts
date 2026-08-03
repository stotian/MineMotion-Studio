import { describe, expect, it } from "vitest";
import {
  assessWorldChunkCacheSize,
  createPortableWorldChunkCache,
  decodePortableWorldChunkCache,
  parsePortableWorldChunkCache,
  serializePortableWorldChunkCache
} from "./WorldChunkCache";

const chunks = [{
  id: "overworld:0,0",
  dimension: "overworld" as const,
  regionX: 0,
  regionZ: 0,
  chunkX: 0,
  chunkZ: 0,
  minY: -64,
  maxY: 319,
  sectionsRead: 2,
  blocks: [
    { id: "stone" as const, minecraftName: "minecraft:stone", x: 0, y: -64, z: 0 },
    {
      id: "oak_log" as const,
      minecraftName: "minecraft:oak_log",
      stateKey: "minecraft:oak_log[axis=y]",
      properties: { axis: "y" },
      x: 1,
      y: 70,
      z: 1
    }
  ],
  unknownBlocks: {},
  warnings: [],
  contentFingerprint: "chunk-1"
}];

describe("WorldChunkCache", () => {
  it("round-trips renderer-neutral chunk data with a verified fingerprint", () => {
    const cache = createPortableWorldChunkCache(chunks, "2026-07-29T00:00:00.000Z");
    const parsed = parsePortableWorldChunkCache(serializePortableWorldChunkCache(cache));
    const decoded = decodePortableWorldChunkCache(parsed);

    expect(decoded).toEqual(chunks);
    expect(cache.states).toHaveLength(2);
    expect(cache.chunks[0].blocks).toHaveLength(8);
  });

  it("rejects tampered cache payloads", () => {
    const cache = createPortableWorldChunkCache(chunks);
    cache.chunks[0].blocks[1] = 999;

    expect(() => decodePortableWorldChunkCache(cache)).toThrow(/fingerprint/i);
  });

  it("reports reviewed package size budgets", () => {
    expect(assessWorldChunkCacheSize(1).level).toBe("ok");
    expect(assessWorldChunkCacheSize(80 * 1024 * 1024).level).toBe("warning");
    expect(assessWorldChunkCacheSize(300 * 1024 * 1024).level).toBe("critical");
  });
});
