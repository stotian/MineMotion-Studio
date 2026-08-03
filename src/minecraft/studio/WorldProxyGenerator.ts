import type { ImportedChunkData, MinecraftBlockSample } from "../import/MinecraftChunkTypes";
import type { MinecraftWorldStudioSettings, StudioBiomePreset } from "./MinecraftStudioTypes";
import { createWorldAreaPlan, hashSeed } from "./WorldAreaPlanner";

export interface ProxyWorldGenerationResult {
  chunks: ImportedChunkData[];
  warnings: string[];
  blockCount: number;
  seedHash: string;
}

export function generateBoundedProxyWorld(settings: MinecraftWorldStudioSettings): ProxyWorldGenerationResult {
  const plan = createWorldAreaPlan(settings);
  const seedHash = hashSeed(settings.seed || "0");
  const seed = BigInt(`0x${seedHash}`);
  const chunks = plan.chunks.map((planned) => generateChunk(settings, planned.chunkX, planned.chunkZ, planned.lod, seed));
  return {
    chunks,
    warnings: [...plan.warnings, "Proxy terrain is intended for blocking, camera work and construction overlays. Import a save for exact terrain."],
    blockCount: chunks.reduce((sum, chunk) => sum + chunk.blocks.length, 0),
    seedHash
  };
}

function generateChunk(
  settings: MinecraftWorldStudioSettings,
  chunkX: number,
  chunkZ: number,
  lod: "near" | "medium" | "far",
  seed: bigint
): ImportedChunkData {
  const blocks: MinecraftBlockSample[] = [];
  const step = lod === "near" ? 1 : lod === "medium" ? 2 : 4;
  const minY = settings.area.minY;
  const maxY = settings.area.maxY;
  for (let localZ = 0; localZ < 16; localZ += step) {
    for (let localX = 0; localX < 16; localX += step) {
      const x = chunkX * 16 + localX;
      const z = chunkZ * 16 + localZ;
      const height = clamp(Math.round(baseHeight(settings.biomePreset) + terrainNoise(seed, x, z) * terrainAmplitude(settings.biomePreset)), minY + 2, maxY - 3);
      addColumn(blocks, settings.biomePreset, x, z, height, step);
      if (step === 1 && shouldPlaceFeature(seed, x, z, settings.biomePreset)) {
        addFeature(blocks, settings.biomePreset, x, z, height + 1);
      }
    }
  }
  return {
    id: `proxy:${settings.area.dimension}:${chunkX}:${chunkZ}`,
    dimension: settings.area.dimension,
    regionX: Math.floor(chunkX / 32),
    regionZ: Math.floor(chunkZ / 32),
    chunkX,
    chunkZ,
    minY,
    maxY,
    sectionsRead: Math.max(1, Math.ceil((maxY - minY + 1) / 16)),
    blocks,
    unknownBlocks: {},
    warnings: lod === "near" ? [] : [`${lod} proxy LOD uses ${step}x${step} surface sampling.`],
    status: "studio-proxy",
    biomePalette: [settings.biomePreset],
    contentFingerprint: `proxy-${hashSeed(`${seed.toString(16)}:${chunkX}:${chunkZ}:${lod}:${settings.biomePreset}`)}`
  };
}

function addColumn(blocks: MinecraftBlockSample[], biome: StudioBiomePreset, x: number, z: number, height: number, step: number): void {
  const top = topBlock(biome);
  const filler = fillerBlock(biome);
  const base = baseBlock(biome);
  pushBlock(blocks, base, x, height - 2, z);
  pushBlock(blocks, filler, x, height - 1, z);
  pushBlock(blocks, top, x, height, z);
  if (step > 1) {
    for (let dz = 0; dz < step; dz += 1) for (let dx = 0; dx < step; dx += 1) {
      if (dx === 0 && dz === 0) continue;
      pushBlock(blocks, top, x + dx, height, z + dz);
    }
  }
  if (biome === "plains" || biome === "forest") {
    const sea = 63;
    if (height < sea) for (let y = height + 1; y <= sea; y += 1) pushBlock(blocks, "minecraft:water", x, y, z);
  }
}

function addFeature(blocks: MinecraftBlockSample[], biome: StudioBiomePreset, x: number, z: number, y: number): void {
  if (biome === "forest" || biome === "plains") {
    for (let dy = 0; dy < 4; dy += 1) pushBlock(blocks, "minecraft:oak_log", x, y + dy, z);
    for (let dz = -1; dz <= 1; dz += 1) for (let dx = -1; dx <= 1; dx += 1) pushBlock(blocks, "minecraft:oak_leaves", x + dx, y + 4, z + dz);
  } else if (biome === "nether") {
    pushBlock(blocks, "minecraft:glowstone", x, y, z);
  } else if (biome === "end") {
    for (let dy = 0; dy < 3; dy += 1) pushBlock(blocks, "minecraft:end_stone", x, y + dy, z);
  } else if (biome === "snow") {
    pushBlock(blocks, "minecraft:snow", x, y, z);
  }
}

function pushBlock(blocks: MinecraftBlockSample[], minecraftName: string, x: number, y: number, z: number): void {
  blocks.push({ id: mapProxyBlock(minecraftName), minecraftName, stateKey: minecraftName, x, y, z });
}

function mapProxyBlock(name: string): MinecraftBlockSample["id"] {
  const short = name.replace("minecraft:", "");
  if (["grass_block", "dirt", "stone", "sand", "snow", "netherrack", "end_stone", "oak_log", "oak_leaves", "water", "glowstone"].includes(short)) return short as MinecraftBlockSample["id"];
  return "unknown";
}

function baseHeight(biome: StudioBiomePreset): number {
  return biome === "nether" ? 48 : biome === "end" ? 62 : biome === "desert" ? 66 : biome === "snow" ? 70 : 64;
}
function terrainAmplitude(biome: StudioBiomePreset): number {
  return biome === "plains" ? 6 : biome === "forest" ? 10 : biome === "desert" ? 8 : biome === "snow" ? 14 : biome === "nether" ? 12 : 7;
}
function topBlock(biome: StudioBiomePreset): string {
  if (biome === "desert") return "minecraft:sand";
  if (biome === "snow") return "minecraft:snow";
  if (biome === "nether") return "minecraft:netherrack";
  if (biome === "end") return "minecraft:end_stone";
  return "minecraft:grass_block";
}
function fillerBlock(biome: StudioBiomePreset): string {
  return biome === "desert" ? "minecraft:sand" : biome === "nether" ? "minecraft:netherrack" : biome === "end" ? "minecraft:end_stone" : "minecraft:dirt";
}
function baseBlock(biome: StudioBiomePreset): string {
  return biome === "nether" ? "minecraft:netherrack" : biome === "end" ? "minecraft:end_stone" : "minecraft:stone";
}
function terrainNoise(seed: bigint, x: number, z: number): number {
  const a = hash32(Number(BigInt.asUintN(32, seed ^ BigInt(x * 374761393) ^ BigInt(z * 668265263))));
  const b = hash32(a ^ hash32(x * 1274126177) ^ hash32(z * 1431374977));
  return ((b >>> 0) / 0xffffffff) * 2 - 1;
}
function shouldPlaceFeature(seed: bigint, x: number, z: number, biome: StudioBiomePreset): boolean {
  if (biome === "desert") return false;
  const divisor = biome === "forest" ? 43 : biome === "plains" ? 137 : 211;
  return Math.abs(hash32(Number(BigInt.asUintN(32, seed)) ^ x * 734287 ^ z * 912931)) % divisor === 0;
}
function hash32(value: number): number {
  let v = value | 0;
  v ^= v >>> 16;
  v = Math.imul(v, 0x7feb352d);
  v ^= v >>> 15;
  v = Math.imul(v, 0x846ca68b);
  v ^= v >>> 16;
  return v >>> 0;
}
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
