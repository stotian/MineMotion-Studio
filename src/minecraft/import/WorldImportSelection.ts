import type {
  MinecraftDimensionScan,
  MinecraftRegionFileRef
} from "./MinecraftChunkTypes";
import type { McaChunkLocation } from "./McaFileReader";

export interface WorldImportSelectionOptions {
  readonly centerChunkX: number;
  readonly centerChunkZ: number;
  readonly radiusChunks: number;
  readonly maxChunks: number;
  readonly maxRegionFiles: number;
  readonly maxVerticalSections: number;
}

export interface WorldImportRequestEstimate {
  readonly selectedRegionFiles: number;
  readonly requestedAreaChunks: number;
  readonly boundedChunkCandidates: number;
  readonly maximumDecodedBlocks: number;
  readonly maximumEstimatedMemoryBytes: number;
}

export interface WorldSelectionPreviewCell {
  readonly chunkX: number;
  readonly chunkZ: number;
  readonly regionX: number;
  readonly regionZ: number;
  readonly center: boolean;
  readonly sourceRegionAvailable: boolean;
}

export interface WorldSelectionPreview {
  readonly radius: number;
  readonly clipped: boolean;
  readonly sideLength: number;
  readonly cells: readonly WorldSelectionPreviewCell[];
}

const MAX_PREVIEW_RADIUS = 8;
const ESTIMATED_BYTES_PER_BLOCK = 20;
const BLOCKS_PER_SECTION = 4096;

export function selectWorldRegionFiles(
  regions: readonly MinecraftRegionFileRef[],
  options: WorldImportSelectionOptions
): MinecraftRegionFileRef[] {
  const centerRegionX = Math.floor(options.centerChunkX / 32);
  const centerRegionZ = Math.floor(options.centerChunkZ / 32);
  return [...regions]
    .sort((a, b) => {
      const aDistance = regionDistance(a, centerRegionX, centerRegionZ);
      const bDistance = regionDistance(b, centerRegionX, centerRegionZ);
      if (aDistance !== bDistance) return aDistance - bDistance;
      if ((a.regionZ ?? 0) !== (b.regionZ ?? 0)) {
        return (a.regionZ ?? 0) - (b.regionZ ?? 0);
      }
      return (a.regionX ?? 0) - (b.regionX ?? 0);
    })
    .slice(0, boundedPositiveInteger(options.maxRegionFiles));
}

export function selectWorldChunkLocations(
  locations: readonly McaChunkLocation[],
  options: WorldImportSelectionOptions
): McaChunkLocation[] {
  const radius = boundedNonNegativeInteger(options.radiusChunks);
  const centerX = Math.trunc(options.centerChunkX);
  const centerZ = Math.trunc(options.centerChunkZ);
  return locations
    .filter(
      (location) =>
        Math.abs(location.chunkX - centerX) <= radius &&
        Math.abs(location.chunkZ - centerZ) <= radius
    )
    .sort((a, b) => {
      const aDistance = chunkDistance(a, centerX, centerZ);
      const bDistance = chunkDistance(b, centerX, centerZ);
      if (aDistance !== bDistance) return aDistance - bDistance;
      if (a.chunkZ !== b.chunkZ) return a.chunkZ - b.chunkZ;
      return a.chunkX - b.chunkX;
    })
    .slice(0, boundedPositiveInteger(options.maxChunks));
}

export function createWorldImportRequestEstimate(
  dimension: MinecraftDimensionScan | undefined,
  options: WorldImportSelectionOptions
): WorldImportRequestEstimate {
  const radius = boundedNonNegativeInteger(options.radiusChunks);
  const requestedAreaChunks = (radius * 2 + 1) ** 2;
  const selectedRegionFiles = dimension
    ? selectWorldRegionFiles(dimension.regionFiles, options).length
    : 0;
  const boundedChunkCandidates = Math.min(
    boundedPositiveInteger(options.maxChunks),
    requestedAreaChunks,
    selectedRegionFiles * 1024
  );
  const maximumDecodedBlocks =
    boundedChunkCandidates *
    boundedPositiveInteger(options.maxVerticalSections) *
    BLOCKS_PER_SECTION;
  return Object.freeze({
    selectedRegionFiles,
    requestedAreaChunks,
    boundedChunkCandidates,
    maximumDecodedBlocks,
    maximumEstimatedMemoryBytes:
      maximumDecodedBlocks * ESTIMATED_BYTES_PER_BLOCK
  });
}

export function createWorldSelectionPreview(
  dimension: MinecraftDimensionScan | undefined,
  options: WorldImportSelectionOptions
): WorldSelectionPreview {
  const requestedRadius = boundedNonNegativeInteger(options.radiusChunks);
  const radius = Math.min(MAX_PREVIEW_RADIUS, requestedRadius);
  const centerX = Math.trunc(options.centerChunkX);
  const centerZ = Math.trunc(options.centerChunkZ);
  const availableRegions = new Set(
    (dimension?.regionFiles ?? [])
      .filter(
        (region): region is MinecraftRegionFileRef & {
          regionX: number;
          regionZ: number;
        } => region.regionX !== null && region.regionZ !== null
      )
      .map((region) => regionKey(region.regionX, region.regionZ))
  );
  const cells: WorldSelectionPreviewCell[] = [];
  for (let z = centerZ - radius; z <= centerZ + radius; z += 1) {
    for (let x = centerX - radius; x <= centerX + radius; x += 1) {
      const regionX = Math.floor(x / 32);
      const regionZ = Math.floor(z / 32);
      cells.push(Object.freeze({
        chunkX: x,
        chunkZ: z,
        regionX,
        regionZ,
        center: x === centerX && z === centerZ,
        sourceRegionAvailable: availableRegions.has(regionKey(regionX, regionZ))
      }));
    }
  }
  return Object.freeze({
    radius,
    clipped: requestedRadius > MAX_PREVIEW_RADIUS,
    sideLength: radius * 2 + 1,
    cells: Object.freeze(cells)
  });
}

export function centerChunkForRegion(
  regionX: number,
  regionZ: number
): { centerChunkX: number; centerChunkZ: number } {
  return {
    centerChunkX: Math.trunc(regionX) * 32 + 16,
    centerChunkZ: Math.trunc(regionZ) * 32 + 16
  };
}

function regionDistance(
  region: MinecraftRegionFileRef,
  centerRegionX: number,
  centerRegionZ: number
): number {
  if (region.regionX === null || region.regionZ === null) {
    return Number.MAX_SAFE_INTEGER;
  }
  return (
    Math.abs(region.regionX - centerRegionX) +
    Math.abs(region.regionZ - centerRegionZ)
  );
}

function chunkDistance(
  location: Pick<McaChunkLocation, "chunkX" | "chunkZ">,
  centerChunkX: number,
  centerChunkZ: number
): number {
  return (
    Math.abs(location.chunkX - centerChunkX) +
    Math.abs(location.chunkZ - centerChunkZ)
  );
}

function boundedPositiveInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}

function boundedNonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function regionKey(regionX: number, regionZ: number): string {
  return `${regionX},${regionZ}`;
}
