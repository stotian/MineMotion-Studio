import type { WorldImportProfile } from "./MinecraftChunkTypes";
import type { WorldChunkImportOptions } from "./WorldImportManager";

const MAX_PROFILES = 20;

export function createWorldImportProfile(
  name: string,
  options: WorldChunkImportOptions,
  createdAt = new Date().toISOString(),
  id = `world_profile_${Date.now().toString(36)}`
): WorldImportProfile {
  const safeName = name.trim().slice(0, 80) || "World import profile";
  return {
    id,
    name: safeName,
    createdAt,
    ...sanitizeProfileOptions(options)
  };
}

export function saveWorldImportProfile(
  profiles: readonly WorldImportProfile[] | undefined,
  profile: WorldImportProfile
): WorldImportProfile[] {
  return [
    profile,
    ...sanitizeWorldImportProfiles(profiles).filter((item) => item.id !== profile.id)
  ].slice(0, MAX_PROFILES);
}

export function removeWorldImportProfile(
  profiles: readonly WorldImportProfile[] | undefined,
  profileId: string
): WorldImportProfile[] {
  return sanitizeWorldImportProfiles(profiles).filter((profile) => profile.id !== profileId);
}

export function applyWorldImportProfile(
  profile: WorldImportProfile,
  fallback: WorldChunkImportOptions
): WorldChunkImportOptions {
  const sanitized = sanitizeWorldImportProfiles([profile])[0];
  return sanitized
    ? {
        dimension: sanitized.dimension,
        centerChunkX: sanitized.centerChunkX,
        centerChunkZ: sanitized.centerChunkZ,
        radiusChunks: sanitized.radiusChunks,
        maxChunks: sanitized.maxChunks,
        maxRegionFiles: sanitized.maxRegionFiles,
        maxVerticalSections: sanitized.maxVerticalSections,
        showChunkBorders: sanitized.showChunkBorders,
        showWorldOrigin: sanitized.showWorldOrigin,
        embedImportedChunkCache: sanitized.embedImportedChunkCache
      }
    : fallback;
}

export function sanitizeWorldImportProfiles(value: unknown): WorldImportProfile[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_PROFILES).flatMap((entry, index) => {
    if (!isRecord(entry) || typeof entry.id !== "string" || typeof entry.name !== "string") {
      return [];
    }
    return [{
      id: entry.id.slice(0, 120),
      name: entry.name.trim().slice(0, 80) || `World import profile ${index + 1}`,
      createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date(0).toISOString(),
      ...sanitizeProfileOptions(entry)
    }];
  });
}

function sanitizeProfileOptions(value: Partial<WorldChunkImportOptions>): Omit<
  WorldImportProfile,
  "id" | "name" | "createdAt"
> {
  return {
    dimension: isDimension(value.dimension) ? value.dimension : "overworld",
    centerChunkX: finiteInteger(value.centerChunkX, 0, -30_000_000, 30_000_000),
    centerChunkZ: finiteInteger(value.centerChunkZ, 0, -30_000_000, 30_000_000),
    radiusChunks: finiteInteger(value.radiusChunks, 1, 0, 64),
    maxChunks: finiteInteger(value.maxChunks, 16, 1, 4096),
    maxRegionFiles: finiteInteger(value.maxRegionFiles, 4, 1, 128),
    maxVerticalSections: finiteInteger(value.maxVerticalSections, 24, 1, 64),
    showChunkBorders: value.showChunkBorders !== false,
    showWorldOrigin: value.showWorldOrigin !== false,
    embedImportedChunkCache: value.embedImportedChunkCache !== false
  };
}

function finiteInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, Math.round(value)))
    : fallback;
}

function isDimension(value: unknown): value is WorldImportProfile["dimension"] {
  return value === "overworld" || value === "nether" || value === "end" ||
    (typeof value === "string" && value.startsWith("custom:"));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
