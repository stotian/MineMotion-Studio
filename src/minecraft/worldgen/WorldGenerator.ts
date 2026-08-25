import type { MinecraftBlockSample, ImportedChunkData } from "../import/MinecraftChunkTypes";
import { fbm2, noise2, noise3, parseSeed } from "./SeededNoise";

/**
 * Seeded, chunk-based world generation.
 *
 * Produces the same ImportedChunkData the Anvil importer produces, so generated
 * worlds flow through the existing mesher, cache and culling untouched.
 *
 * This is Minecraft-LIKE, not Minecraft-identical: Mojang's terrain comes from
 * density functions that change between versions, so a given seed will not
 * reproduce the world the game would build. Within this app a seed is fully
 * deterministic — the same seed and coordinates always give the same chunk.
 */

export const CHUNK_SIZE = 16;

export interface WorldGenSettings {
  seed: string;
  /** Chunks generated in each direction from the centre. */
  radiusChunks: number;
  centerChunkX: number;
  centerChunkZ: number;
  /** Lowest and highest block Y written. */
  minY: number;
  maxY: number;
  /** Sea level; anything below it that is open air fills with water. */
  seaLevel: number;
  /** Carve caves. Disabling roughly halves generation time. */
  caves: boolean;
}

export const DEFAULT_WORLDGEN: WorldGenSettings = {
  seed: "blockmotion",
  radiusChunks: 4,
  centerChunkX: 0,
  centerChunkZ: 0,
  minY: -16,
  maxY: 96,
  seaLevel: 62,
  caves: true
};

/** Coarse biome classification, used to pick surface blocks. */
export type BiomeId =
  | "plains"
  | "forest"
  | "desert"
  | "mountains"
  | "snowy"
  | "swamp"
  | "ocean";

interface Column {
  height: number;
  biome: BiomeId;
}

/**
 * Height and biome for one column.
 *
 * Continent noise decides land against ocean, temperature and humidity pick the
 * biome, and a separate roughness field drives mountains — the same layered
 * approach Minecraft uses, at a much smaller scale.
 */
function sampleColumn(seed: number, x: number, z: number, seaLevel: number): Column {
  const continent = fbm2(seed, x, z, 4, 220);
  const roughness = fbm2(seed + 7919, x, z, 5, 70);
  const temperature = fbm2(seed + 104729, x, z, 3, 340);
  const humidity = fbm2(seed + 15485863, x, z, 3, 300);

  // Below this the column is ocean floor rather than land.
  const landness = continent - 0.42;
  if (landness < 0) {
    const depth = Math.round(seaLevel - 6 + landness * 40);
    return { height: Math.max(2, depth), biome: "ocean" };
  }

  const base = seaLevel + landness * 46;
  const relief = (roughness - 0.5) * (30 + landness * 90);
  const height = Math.round(base + relief);

  let biome: BiomeId = "plains";
  if (height > seaLevel + 34) biome = "mountains";
  else if (temperature < 0.32) biome = "snowy";
  else if (temperature > 0.68 && humidity < 0.36) biome = "desert";
  else if (humidity > 0.68 && height < seaLevel + 6) biome = "swamp";
  else if (humidity > 0.55) biome = "forest";

  return { height, biome };
}

/** Surface, subsurface and filler blocks for a biome. */
function surfaceFor(biome: BiomeId, height: number, seaLevel: number): {
  top: string;
  filler: string;
} {
  switch (biome) {
    case "ocean":
      return { top: "gravel", filler: "stone" };
    case "desert":
      return { top: "sand", filler: "sandstone" };
    case "snowy":
      return { top: "snow_block", filler: "dirt" };
    case "swamp":
      return { top: "grass_block", filler: "dirt" };
    case "mountains":
      return height > seaLevel + 52
        ? { top: "snow_block", filler: "stone" }
        : { top: "stone", filler: "stone" };
    default:
      return { top: "grass_block", filler: "dirt" };
  }
}

/** True where a cave should be carved. */
function isCave(seed: number, x: number, y: number, z: number): boolean {
  // Two offset fields intersected: single-field caves read as blobs, whereas
  // the intersection produces connected tunnels.
  const a = noise3(seed + 4241, x / 26, y / 15, z / 26);
  const b = noise3(seed + 8663, x / 22, y / 13, z / 22);
  return a > 0.62 && b > 0.6;
}

function sample(id: string, x: number, y: number, z: number): MinecraftBlockSample {
  return { id, minecraftName: `minecraft:${id}`, x, y, z };
}

/** Generates one chunk. Pure: same inputs always give the same blocks. */
export function generateChunk(
  settings: WorldGenSettings,
  chunkX: number,
  chunkZ: number
): ImportedChunkData {
  const seed = parseSeed(settings.seed);
  const blocks: MinecraftBlockSample[] = [];
  const baseX = chunkX * CHUNK_SIZE;
  const baseZ = chunkZ * CHUNK_SIZE;

  for (let localX = 0; localX < CHUNK_SIZE; localX += 1) {
    for (let localZ = 0; localZ < CHUNK_SIZE; localZ += 1) {
      const worldX = baseX + localX;
      const worldZ = baseZ + localZ;
      const column = sampleColumn(seed, worldX, worldZ, settings.seaLevel);
      const height = Math.min(settings.maxY, Math.max(settings.minY + 1, column.height));
      const { top, filler } = surfaceFor(column.biome, height, settings.seaLevel);

      for (let y = settings.minY; y <= height; y += 1) {
        if (y === settings.minY) {
          blocks.push(sample("bedrock", worldX, y, worldZ));
          continue;
        }
        if (settings.caves && y < height - 2 && isCave(seed, worldX, y, worldZ)) {
          continue; // Carved out.
        }
        if (y === height) blocks.push(sample(top, worldX, y, worldZ));
        else if (y > height - 4) blocks.push(sample(filler, worldX, y, worldZ));
        else if (y < 4) blocks.push(sample("deepslate", worldX, y, worldZ));
        else blocks.push(sample("stone", worldX, y, worldZ));
      }

      // Fill open air below sea level with water.
      for (let y = height + 1; y <= settings.seaLevel; y += 1) {
        blocks.push(sample("water", worldX, y, worldZ));
      }

      // Sparse surface decoration, above water only.
      if (column.biome !== "ocean" && height > settings.seaLevel) {
        const roll = noise2(seed + 991, worldX * 3.7, worldZ * 3.7);
        if (column.biome === "desert" && roll > 0.93) {
          for (let step = 1; step <= 3; step += 1) {
            blocks.push(sample("cactus", worldX, height + step, worldZ));
          }
        } else if (column.biome === "forest" && roll > 0.86) {
          for (let step = 1; step <= 4; step += 1) {
            blocks.push(sample("oak_log", worldX, height + step, worldZ));
          }
          blocks.push(sample("oak_leaves", worldX, height + 5, worldZ));
        } else if (roll > 0.97) {
          blocks.push(sample("short_grass", worldX, height + 1, worldZ));
        }
      }
    }
  }

  return {
    id: `gen_${chunkX}_${chunkZ}`,
    dimension: "overworld",
    regionX: Math.floor(chunkX / 32),
    regionZ: Math.floor(chunkZ / 32),
    chunkX,
    chunkZ,
    minY: settings.minY,
    maxY: settings.maxY,
    sectionsRead: Math.ceil((settings.maxY - settings.minY) / 16),
    blocks,
    unknownBlocks: {},
    warnings: []
  };
}

/** Every chunk coordinate a radius covers, nearest to the centre first. */
export function listChunkCoords(
  settings: WorldGenSettings
): Array<{ chunkX: number; chunkZ: number }> {
  const coords: Array<{ chunkX: number; chunkZ: number }> = [];
  const { radiusChunks: r, centerChunkX: cx, centerChunkZ: cz } = settings;
  for (let dx = -r; dx <= r; dx += 1) {
    for (let dz = -r; dz <= r; dz += 1) {
      coords.push({ chunkX: cx + dx, chunkZ: cz + dz });
    }
  }
  // Nearest-first, so a partial or streamed generation fills in from the centre.
  return coords.sort(
    (a, b) =>
      (a.chunkX - cx) ** 2 + (a.chunkZ - cz) ** 2 -
      ((b.chunkX - cx) ** 2 + (b.chunkZ - cz) ** 2)
  );
}

export interface GenerationProgress {
  completed: number;
  total: number;
  chunk: ImportedChunkData;
}

/**
 * Generates every chunk in the radius.
 *
 * Yields chunk by chunk so a caller can render progressively and stay
 * responsive: a radius of 8 is 289 chunks, which is far too much to build in
 * one blocking pass.
 */
export function* generateWorld(
  settings: WorldGenSettings
): Generator<GenerationProgress, void, void> {
  const coords = listChunkCoords(settings);
  let completed = 0;
  for (const { chunkX, chunkZ } of coords) {
    const chunk = generateChunk(settings, chunkX, chunkZ);
    completed += 1;
    yield { completed, total: coords.length, chunk };
  }
}

/** Rough block count for a radius, for warning before a huge generation. */
export function estimateBlockCount(settings: WorldGenSettings): number {
  const chunks = (settings.radiusChunks * 2 + 1) ** 2;
  const columnHeight = Math.max(1, settings.seaLevel - settings.minY);
  return chunks * CHUNK_SIZE * CHUNK_SIZE * columnHeight;
}
