import { describe, expect, it } from "vitest";
import { parseSeed, fbm2, noise3 } from "./SeededNoise";
import {
  CHUNK_SIZE,
  DEFAULT_WORLDGEN,
  estimateBlockCount,
  generateChunk,
  generateWorld,
  listChunkCoords,
  type WorldGenSettings
} from "./WorldGenerator";

const settings: WorldGenSettings = { ...DEFAULT_WORLDGEN, radiusChunks: 1 };

describe("seeded noise", () => {
  it("uses numeric seeds directly and hashes text seeds", () => {
    expect(parseSeed("12345")).toBe(12345);
    expect(parseSeed("-42")).toBe(-42);
    expect(parseSeed("hello")).toBe(parseSeed("hello"));
    expect(parseSeed("hello")).not.toBe(parseSeed("world"));
  });

  it("is deterministic and stays in range", () => {
    for (let i = 0; i < 40; i += 1) {
      const value = fbm2(7, i * 3.1, i * 1.7, 4, 60);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
      expect(fbm2(7, i * 3.1, i * 1.7, 4, 60)).toBe(value);
    }
    expect(noise3(3, 1.5, 2.5, 3.5)).toBe(noise3(3, 1.5, 2.5, 3.5));
  });

  it("varies across space rather than returning a constant", () => {
    const samples = new Set<number>();
    for (let x = 0; x < 20; x += 1) samples.add(fbm2(1, x * 17, 0, 4, 60));
    expect(samples.size).toBeGreaterThan(15);
  });
});

describe("chunk generation", () => {
  it("is deterministic for a seed and coordinate", () => {
    const a = generateChunk(settings, 3, -2);
    const b = generateChunk(settings, 3, -2);
    expect(a.blocks.length).toBe(b.blocks.length);
    expect(a.blocks[0]).toEqual(b.blocks[0]);
    expect(a.blocks.at(-1)).toEqual(b.blocks.at(-1));
  });

  it("produces different terrain for a different seed", () => {
    const a = generateChunk(settings, 0, 0);
    const b = generateChunk({ ...settings, seed: "other" }, 0, 0);
    expect(a.blocks.length).not.toBe(b.blocks.length);
  });

  it("keeps every block inside its own chunk footprint", () => {
    const chunk = generateChunk(settings, 2, 5);
    const minX = 2 * CHUNK_SIZE;
    const minZ = 5 * CHUNK_SIZE;
    for (const block of chunk.blocks) {
      expect(block.x).toBeGreaterThanOrEqual(minX);
      expect(block.x).toBeLessThan(minX + CHUNK_SIZE);
      expect(block.z).toBeGreaterThanOrEqual(minZ);
      expect(block.z).toBeLessThan(minZ + CHUNK_SIZE);
    }
  });

  it("respects the vertical bounds", () => {
    const chunk = generateChunk(settings, 0, 0);
    for (const block of chunk.blocks) {
      expect(block.y).toBeGreaterThanOrEqual(settings.minY);
      expect(block.y).toBeLessThanOrEqual(settings.maxY);
    }
  });

  it("lays bedrock at the floor of every column", () => {
    const chunk = generateChunk(settings, 0, 0);
    const floors = chunk.blocks.filter((block) => block.y === settings.minY);
    expect(floors.length).toBe(CHUNK_SIZE * CHUNK_SIZE);
    expect(floors.every((block) => block.id === "bedrock")).toBe(true);
  });

  it("never stacks two blocks in one position", () => {
    const chunk = generateChunk(settings, 1, 1);
    const seen = new Set(chunk.blocks.map((b) => `${b.x},${b.y},${b.z}`));
    expect(seen.size).toBe(chunk.blocks.length);
  });

  it("carves caves only when asked", () => {
    const withCaves = generateChunk({ ...settings, caves: true }, 4, 4);
    const solid = generateChunk({ ...settings, caves: false }, 4, 4);
    expect(withCaves.blocks.length).toBeLessThan(solid.blocks.length);
  });

  it("emits ids the block registry knows", () => {
    const chunk = generateChunk(settings, 0, 0);
    const ids = new Set(chunk.blocks.map((block) => block.id));
    for (const id of ids) {
      expect(id).toMatch(/^[a-z_]+$/);
    }
    expect(ids.has("bedrock")).toBe(true);
  });

  it("names blocks in the minecraft namespace for the importer pipeline", () => {
    const chunk = generateChunk(settings, 0, 0);
    expect(chunk.blocks.every((b) => b.minecraftName.startsWith("minecraft:"))).toBe(true);
  });
});

describe("world generation", () => {
  it("covers the full radius", () => {
    expect(listChunkCoords({ ...settings, radiusChunks: 0 })).toHaveLength(1);
    expect(listChunkCoords({ ...settings, radiusChunks: 1 })).toHaveLength(9);
    expect(listChunkCoords({ ...settings, radiusChunks: 4 })).toHaveLength(81);
  });

  it("orders chunks nearest to the centre first", () => {
    const coords = listChunkCoords({ ...settings, radiusChunks: 2, centerChunkX: 10, centerChunkZ: 10 });
    // Progressive rendering depends on the centre arriving first.
    expect(coords[0]).toEqual({ chunkX: 10, chunkZ: 10 });
  });

  it("yields chunk by chunk with progress", () => {
    const steps = [...generateWorld({ ...settings, radiusChunks: 1 })];
    expect(steps).toHaveLength(9);
    expect(steps[0].completed).toBe(1);
    expect(steps[0].total).toBe(9);
    expect(steps.at(-1)?.completed).toBe(9);
  });

  it("estimates block counts so a huge radius can be warned about", () => {
    const small = estimateBlockCount({ ...settings, radiusChunks: 1 });
    const large = estimateBlockCount({ ...settings, radiusChunks: 8 });
    expect(large).toBeGreaterThan(small * 20);
  });
});
