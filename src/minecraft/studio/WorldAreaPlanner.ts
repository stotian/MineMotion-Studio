import type { MinecraftBoundedArea, MinecraftWorldStudioSettings } from "./MinecraftStudioTypes";

export type WorldLodTier = "near" | "medium" | "far";

export interface PlannedChunk {
  chunkX: number;
  chunkZ: number;
  distance: number;
  lod: WorldLodTier;
  priority: number;
}

export interface WorldAreaPlan {
  chunks: PlannedChunk[];
  requestedChunks: number;
  activeChunks: number;
  clippedChunks: number;
  verticalBlocks: number;
  estimatedSurfaceBlocks: number;
  estimatedFullBlocks: number;
  estimatedMemoryBytes: number;
  seedHash: string;
  warnings: string[];
}

export function createWorldAreaPlan(settings: MinecraftWorldStudioSettings): WorldAreaPlan {
  const area = normalizeArea(settings.area);
  const candidates: PlannedChunk[] = [];
  for (let z = -area.radiusChunks; z <= area.radiusChunks; z += 1) {
    for (let x = -area.radiusChunks; x <= area.radiusChunks; x += 1) {
      const distance = Math.max(Math.abs(x), Math.abs(z));
      candidates.push({
        chunkX: area.centerChunkX + x,
        chunkZ: area.centerChunkZ + z,
        distance,
        lod: distance <= area.nearLodRadius ? "near" : distance <= area.mediumLodRadius ? "medium" : "far",
        priority: distance * 1000 + Math.abs(x) + Math.abs(z)
      });
    }
  }
  candidates.sort((a, b) => a.priority - b.priority || a.chunkZ - b.chunkZ || a.chunkX - b.chunkX);
  const chunks = candidates.slice(0, area.maxActiveChunks);
  const requestedChunks = candidates.length;
  const verticalBlocks = area.maxY - area.minY + 1;
  const estimatedSurfaceBlocks = chunks.reduce((sum, chunk) => sum + (chunk.lod === "near" ? 1024 : chunk.lod === "medium" ? 512 : 256), 0);
  const estimatedFullBlocks = chunks.length * 16 * 16 * verticalBlocks;
  const estimatedMemoryBytes = estimatedSurfaceBlocks * 32 + chunks.length * 4096;
  const warnings: string[] = [];
  if (requestedChunks > area.maxActiveChunks) warnings.push(`${requestedChunks - area.maxActiveChunks} chunks are clipped by maxActiveChunks.`);
  if (settings.sourceMode === "seed-proxy") warnings.push("Seed proxy terrain is deterministic staging geometry, not exact Mojang or mod world generation.");
  if (settings.exactWorldRequired && settings.sourceMode !== "imported-save") warnings.push("Exact world mode requires importing the matching Minecraft save folder.");
  if (settings.loader !== "vanilla" && settings.mods.filter((mod) => mod.enabled).length === 0) warnings.push(`${settings.loader} is selected but no enabled mod manifest is registered.`);
  if (verticalBlocks > 384) warnings.push("Large vertical range increases import, editing and mesh costs.");
  return {
    chunks,
    requestedChunks,
    activeChunks: chunks.length,
    clippedChunks: requestedChunks - chunks.length,
    verticalBlocks,
    estimatedSurfaceBlocks,
    estimatedFullBlocks,
    estimatedMemoryBytes,
    seedHash: hashSeed(settings.seed || "0"),
    warnings
  };
}

export function normalizeArea(area: MinecraftBoundedArea): MinecraftBoundedArea {
  const minY = Math.min(area.minY, area.maxY);
  const maxY = Math.max(area.minY, area.maxY);
  const radiusChunks = clampInt(area.radiusChunks, 0, 32);
  const near = clampInt(area.nearLodRadius, 0, radiusChunks);
  const medium = clampInt(area.mediumLodRadius, near, radiusChunks);
  return {
    ...area,
    centerChunkX: clampInt(area.centerChunkX, -30_000_000, 30_000_000),
    centerChunkZ: clampInt(area.centerChunkZ, -30_000_000, 30_000_000),
    radiusChunks,
    minY: clampInt(minY, -128, 2048),
    maxY: clampInt(maxY, -127, 2048),
    maxActiveChunks: clampInt(area.maxActiveChunks, 1, 1024),
    nearLodRadius: near,
    mediumLodRadius: medium,
    unloadDistanceChunks: clampInt(area.unloadDistanceChunks, Math.max(1, radiusChunks), 64)
  };
}

export function hashSeed(seed: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (const byte of new TextEncoder().encode(seed)) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, "0");
}

export function chunkContainsBlock(chunkX: number, chunkZ: number, x: number, z: number): boolean {
  return Math.floor(x / 16) === chunkX && Math.floor(z / 16) === chunkZ;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(Number.isFinite(value) ? value : min)));
}
