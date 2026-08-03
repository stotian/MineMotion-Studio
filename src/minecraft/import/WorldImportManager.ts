import type { ImportedWorldSummary } from "../../project/ProjectFile";
import { MinecraftWorldScanner } from "./MinecraftWorldScanner";
import type {
  ImportedChunkData,
  ImportedChunkRange,
  MinecraftDimensionId,
  MinecraftWorldScan,
  WorldImportPerformanceEstimate,
  WorldRenderOptions
} from "./MinecraftChunkTypes";
import { McaFileReader } from "./McaFileReader";
import { createWorldImportProgress, type WorldImportProgress } from "./WorldImportProgress";
import { selectWorldChunkLocations, selectWorldRegionFiles } from "./WorldImportSelection";
import { WorldChunkDecodeClient } from "./WorldChunkDecodeClient";
import {
  isOperationAborted,
  operationAbortReason,
  throwIfOperationAborted
} from "../../core/async/LatestOperationController";
import {
  READ_ONLY_WORLD_SOURCE_POLICY,
  withWorldSceneOverridesDefaults
} from "../staging/WorldSceneOverrides";
import {
  assessWorldChunkCacheSize,
  estimatePortableWorldChunkCacheBytes,
  WORLD_CHUNK_CACHE_CODEC,
  WORLD_CHUNK_CACHE_FORMAT_VERSION
} from "../cache/WorldChunkCache";

export interface WorldChunkImportOptions {
  dimension: MinecraftDimensionId;
  centerChunkX: number;
  centerChunkZ: number;
  radiusChunks: number;
  maxChunks: number;
  maxRegionFiles: number;
  maxVerticalSections: number;
  showChunkBorders: boolean;
  showWorldOrigin: boolean;
  embedImportedChunkCache: boolean;
}

export const DEFAULT_WORLD_IMPORT_OPTIONS: WorldChunkImportOptions = {
  dimension: "overworld",
  centerChunkX: 0,
  centerChunkZ: 0,
  radiusChunks: 1,
  maxChunks: 16,
  maxRegionFiles: 4,
  maxVerticalSections: 24,
  showChunkBorders: true,
  showWorldOrigin: true,
  embedImportedChunkCache: true
};

export type WorldImportMode = "replace" | "update-changed";

export interface WorldImportResult {
  operationId: number;
  world: ImportedWorldSummary;
  chunks: ImportedChunkData[];
  estimate: WorldImportPerformanceEstimate;
  decodedChunks: number;
  reusedChunks: number;
}

export class WorldImportManager {
  static async scan(
    files: FileList | File[],
    signal?: AbortSignal
  ): Promise<MinecraftWorldScan> {
    if (signal) throwIfOperationAborted(signal);
    const scan = await MinecraftWorldScanner.scan(files, signal);
    if (signal) throwIfOperationAborted(signal);
    return scan;
  }

  static createSummaryFromScan(
    scan: MinecraftWorldScan,
    options: Partial<WorldChunkImportOptions> = {}
  ): ImportedWorldSummary {
    const mergedOptions = { ...DEFAULT_WORLD_IMPORT_OPTIONS, ...options };
    return {
      sourceName: scan.sourceName,
      sourcePath: scan.sourceName,
      levelDatFound: scan.level.found,
      levelName: scan.level.levelName || undefined,
      spawn: scan.level.spawn ?? undefined,
      dimensions: scan.dimensions.map((dimension) => ({
        id: dimension.id,
        label: dimension.label,
        regionFiles: dimension.regionFiles.map((region) => region.path),
        estimatedChunks: dimension.estimatedChunks
      })),
      selectedDimension: mergedOptions.dimension,
      importedChunkRanges: [],
      importProfiles: [],
      importedChunks: [],
      unknownBlockMappings: {},
      unknownBlockCount: 0,
      importSettings: snapshotOptions(mergedOptions),
      performanceEstimate: {
        regionFiles: scan.dimensions.reduce(
          (sum, dimension) => sum + dimension.regionFiles.length,
          0
        ),
        estimatedChunks: scan.dimensions.reduce(
          (sum, dimension) => sum + dimension.estimatedChunks,
          0
        ),
        importedChunks: 0,
        importedBlocks: 0,
        visibleBlocks: 0,
        estimatedMemoryBytes: 0,
        warnings: scan.warnings
      },
      cachedMesh: {
        embedded: false,
        generatedAt: "",
        chunkCount: 0,
        blockCount: 0
      },
      renderOptions: {
        showChunkBorders: mergedOptions.showChunkBorders,
        showWorldOrigin: mergedOptions.showWorldOrigin
      },
      sceneOverrides: withWorldSceneOverridesDefaults(undefined),
      sourcePolicy: READ_ONLY_WORLD_SOURCE_POLICY,
      importedAt: new Date().toISOString(),
      notes: scan.warnings
    };
  }

  static async importChunks(options: {
    scan: MinecraftWorldScan;
    importOptions: WorldChunkImportOptions;
    operationId: number;
    signal: AbortSignal;
    onProgress: (progress: WorldImportProgress) => void;
    mode?: WorldImportMode;
    existingWorld?: ImportedWorldSummary | null;
  }): Promise<WorldImportResult> {
    const {
      scan,
      importOptions,
      operationId,
      signal,
      onProgress,
      mode = "replace",
      existingWorld = null
    } = options;
    throwIfOperationAborted(signal);
    const dimension = scan.dimensions.find(
      (item) => item.id === importOptions.dimension
    );
    if (!dimension) {
      throw new Error(`Dimension ${importOptions.dimension} was not found.`);
    }

    const selectedRegions = selectWorldRegionFiles(
      dimension.regionFiles,
      importOptions
    );
    const selectedChunks: ImportedChunkData[] = [];
    const existingChunksById = new Map(
      (existingWorld?.importedChunks ?? []).map((chunk) => [chunk.id, chunk])
    );
    const warnings = [...scan.warnings];
    let decodedChunks = 0;
    let reusedChunks = 0;
    let totalCandidates = Math.max(1, importOptions.maxChunks);
    const chunkDecoder = new WorldChunkDecodeClient();
    const reportProgress = (
      patch: Omit<Partial<WorldImportProgress>, "operationId">
    ) => {
      throwIfOperationAborted(signal);
      onProgress(createWorldImportProgress({ ...patch, operationId }));
    };

    reportProgress({
      status: "reading-regions",
      total: selectedRegions.length,
      message: `Reading ${selectedRegions.length} region files.`
    });

    try {
      for (const [regionIndex, region] of selectedRegions.entries()) {
        throwIfOperationAborted(signal);

        try {
          const buffer = await region.file.arrayBuffer();
          throwIfOperationAborted(signal);
          const header = McaFileReader.readHeader(
            buffer,
            region.regionX ?? 0,
            region.regionZ ?? 0
          );
          const locations = selectWorldChunkLocations(
            header.locations,
            importOptions
          );
          totalCandidates = Math.max(totalCandidates, locations.length);

          for (const location of locations) {
            throwIfOperationAborted(signal);
            if (selectedChunks.length >= importOptions.maxChunks) break;

            reportProgress({
              status: "reading-chunks",
              current: selectedChunks.length + 1,
              total: importOptions.maxChunks,
              message: `Reading chunk ${location.chunkX}, ${location.chunkZ}.`
            });

            try {
              const payload = McaFileReader.readChunkPayload(buffer, location);
              const contentFingerprint = fingerprintChunkPayload(
                payload.compressionType,
                payload.data
              );
              const chunkId = `${importOptions.dimension}:${location.chunkX},${location.chunkZ}`;
              const existingChunk = existingChunksById.get(chunkId);
              if (
                mode === "update-changed" &&
                existingChunk?.contentFingerprint === contentFingerprint
              ) {
                selectedChunks.push(existingChunk);
                reusedChunks += 1;
              } else {
                const decoded = await chunkDecoder.decode(
                  {
                    compressedData: payload.data,
                    compressionType: payload.compressionType,
                    dimension: importOptions.dimension,
                    fallbackChunkX: location.chunkX,
                    fallbackChunkZ: location.chunkZ,
                    regionX: header.regionX,
                    regionZ: header.regionZ,
                    maxVerticalSections: importOptions.maxVerticalSections
                  },
                  { operationId, signal }
                );
                throwIfOperationAborted(signal);
                const chunk: ImportedChunkData = {
                  ...decoded,
                  sourceTimestamp: location.timestamp,
                  contentFingerprint
                };
                selectedChunks.push(chunk);
                decodedChunks += 1;
                warnings.push(...chunk.warnings);
              }
            } catch (error) {
              if (isOperationAborted(error)) throw error;
              warnings.push(
                error instanceof Error
                  ? `Chunk ${location.chunkX},${location.chunkZ}: ${error.message}`
                  : `Chunk ${location.chunkX},${location.chunkZ}: unreadable chunk.`
              );
            }

            await yieldToBrowser(signal);
          }
        } catch (error) {
          if (isOperationAborted(error)) throw error;
          warnings.push(
            error instanceof Error
              ? `Region ${region.path}: ${error.message}`
              : `Region ${region.path}: unreadable region.`
          );
        }

        reportProgress({
          status: "reading-regions",
          current: regionIndex + 1,
          total: selectedRegions.length,
          message: `Finished region ${region.path}.`
        });
      }
    } finally {
      chunkDecoder.dispose();
    }

    const chunks = mode === "update-changed"
      ? mergeImportedChunks(existingWorld?.importedChunks ?? [], selectedChunks)
      : selectedChunks;
    const importedBlocks = chunks.reduce(
      (sum, chunk) => sum + chunk.blocks.length,
      0
    );
    const unknownBlockMappings: Record<string, string> = {};
    for (const chunk of chunks) {
      for (const name of Object.keys(chunk.unknownBlocks)) {
        unknownBlockMappings[name] = "unknown";
      }
    }
    const unknownBlockCount = chunks.reduce(
      (sum, chunk) =>
        sum + Object.values(chunk.unknownBlocks).reduce((a, b) => a + b, 0),
      0
    );
    const importRange: ImportedChunkRange = snapshotOptions(importOptions);
    const renderOptions: WorldRenderOptions = {
      showChunkBorders: importOptions.showChunkBorders,
      showWorldOrigin: importOptions.showWorldOrigin
    };
    const estimate: WorldImportPerformanceEstimate = {
      regionFiles: selectedRegions.length,
      estimatedChunks: totalCandidates,
      importedChunks: chunks.length,
      importedBlocks,
      visibleBlocks: importedBlocks,
      estimatedMemoryBytes: importedBlocks * 20,
      warnings: warnings.slice(0, 100)
    };
    const generatedAt = new Date().toISOString();
    const cacheFingerprint = fingerprintImportedChunks(chunks);
    const cacheSize = assessWorldChunkCacheSize(
      estimatePortableWorldChunkCacheBytes(chunks)
    );
    if (cacheSize.level !== "ok") warnings.push(cacheSize.message);
    const previousRanges = mode === "update-changed"
      ? existingWorld?.importedChunkRanges ?? []
      : [];

    const world: ImportedWorldSummary = {
      ...WorldImportManager.createSummaryFromScan(scan, importOptions),
      selectedDimension: importOptions.dimension,
      importedChunkRanges: mergeImportRanges(previousRanges, importRange),
      importProfiles: existingWorld?.importProfiles ?? [],
      importedChunks: chunks,
      unknownBlockMappings,
      unknownBlockCount,
      importSettings: importRange,
      performanceEstimate: estimate,
      cachedMesh: {
        embedded: importOptions.embedImportedChunkCache,
        generatedAt,
        chunkCount: chunks.length,
        blockCount: importedBlocks,
        formatVersion: WORLD_CHUNK_CACHE_FORMAT_VERSION,
        fingerprint: cacheFingerprint,
        estimatedBytes: cacheSize.estimatedBytes,
        cacheCodec: WORLD_CHUNK_CACHE_CODEC,
        ...(cacheSize.level === "ok" ? {} : { sizeWarning: cacheSize.level }),
        resourcePackId: existingWorld?.cachedMesh?.resourcePackId ?? null
      },
      renderOptions,
      sceneOverrides: withWorldSceneOverridesDefaults(existingWorld?.sceneOverrides),
      sourcePolicy: READ_ONLY_WORLD_SOURCE_POLICY,
      notes: [...new Set(warnings)].slice(0, 100)
    };

    reportProgress({
      status: "complete",
      current: selectedChunks.length,
      total: importOptions.maxChunks,
      message: mode === "update-changed"
        ? `Updated ${decodedChunks} changed chunks and reused ${reusedChunks} unchanged chunks.`
        : `Imported ${chunks.length} chunks with ${importedBlocks} blocks.`
    });

    return {
      operationId,
      world,
      chunks,
      estimate,
      decodedChunks,
      reusedChunks
    };
  }

  static unloadChunks(
    world: ImportedWorldSummary,
    options: WorldChunkImportOptions
  ): ImportedWorldSummary {
    const retainedChunks = (world.importedChunks ?? []).filter(
      (chunk) => !isChunkInsideSelection(chunk, options)
    );
    const importedBlocks = retainedChunks.reduce(
      (sum, chunk) => sum + chunk.blocks.length,
      0
    );
    const invalidatedAt = new Date().toISOString();
    return {
      ...world,
      importedChunks: retainedChunks,
      importedChunkRanges: (world.importedChunkRanges ?? []).filter(
        (range) => !sameImportRange(range, snapshotOptions(options))
      ),
      unknownBlockCount: retainedChunks.reduce(
        (sum, chunk) =>
          sum + Object.values(chunk.unknownBlocks).reduce((a, b) => a + b, 0),
        0
      ),
      performanceEstimate: {
        ...(world.performanceEstimate ?? {
          regionFiles: 0,
          estimatedChunks: 0,
          importedChunks: 0,
          importedBlocks: 0,
          visibleBlocks: 0,
          estimatedMemoryBytes: 0,
          warnings: []
        }),
        importedChunks: retainedChunks.length,
        importedBlocks,
        visibleBlocks: importedBlocks,
        estimatedMemoryBytes: importedBlocks * 20
      },
      cachedMesh: {
        embedded: retainedChunks.length > 0,
        generatedAt: invalidatedAt,
        chunkCount: retainedChunks.length,
        blockCount: importedBlocks,
        formatVersion: WORLD_CHUNK_CACHE_FORMAT_VERSION,
        fingerprint: fingerprintImportedChunks(retainedChunks),
        estimatedBytes: estimatePortableWorldChunkCacheBytes(retainedChunks),
        cacheCodec: WORLD_CHUNK_CACHE_CODEC,
        resourcePackId: world.cachedMesh?.resourcePackId ?? null,
        invalidatedAt,
        invalidationReason: "Selected chunks were unloaded."
      },
      notes: [...new Set([
        ...world.notes,
        `Unloaded selected chunks around ${options.centerChunkX},${options.centerChunkZ}.`
      ])].slice(-100)
    };
  }
}

function snapshotOptions(options: WorldChunkImportOptions): ImportedChunkRange {
  return {
    dimension: options.dimension,
    centerChunkX: finiteRounded(options.centerChunkX, 0),
    centerChunkZ: finiteRounded(options.centerChunkZ, 0),
    radiusChunks: Math.max(0, finiteRounded(options.radiusChunks, 0)),
    maxChunks: Math.max(1, finiteRounded(options.maxChunks, 1)),
    maxRegionFiles: Math.max(1, finiteRounded(options.maxRegionFiles, 1)),
    maxVerticalSections: Math.max(1, finiteRounded(options.maxVerticalSections, 1))
  };
}

function finiteRounded(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.round(value) : fallback;
}


function mergeImportedChunks(
  existing: readonly ImportedChunkData[],
  selected: readonly ImportedChunkData[]
): ImportedChunkData[] {
  const merged = new Map(existing.map((chunk) => [chunk.id, chunk]));
  selected.forEach((chunk) => merged.set(chunk.id, chunk));
  return [...merged.values()].sort((a, b) =>
    a.dimension === b.dimension
      ? a.chunkZ === b.chunkZ
        ? a.chunkX - b.chunkX
        : a.chunkZ - b.chunkZ
      : a.dimension.localeCompare(b.dimension)
  );
}

function mergeImportRanges(
  existing: readonly ImportedChunkRange[],
  current: ImportedChunkRange
): ImportedChunkRange[] {
  return [
    ...existing.filter((range) => !sameImportRange(range, current)),
    current
  ];
}

function sameImportRange(
  left: ImportedChunkRange,
  right: ImportedChunkRange
): boolean {
  return left.dimension === right.dimension &&
    left.centerChunkX === right.centerChunkX &&
    left.centerChunkZ === right.centerChunkZ &&
    left.radiusChunks === right.radiusChunks &&
    left.maxChunks === right.maxChunks &&
    left.maxRegionFiles === right.maxRegionFiles &&
    left.maxVerticalSections === right.maxVerticalSections;
}

function isChunkInsideSelection(
  chunk: ImportedChunkData,
  options: WorldChunkImportOptions
): boolean {
  const radius = Number.isFinite(options.radiusChunks)
    ? Math.max(0, Math.floor(options.radiusChunks))
    : 0;
  return chunk.dimension === options.dimension &&
    Math.abs(chunk.chunkX - Math.trunc(options.centerChunkX)) <= radius &&
    Math.abs(chunk.chunkZ - Math.trunc(options.centerChunkZ)) <= radius;
}

function fingerprintChunkPayload(
  compressionType: number,
  bytes: Uint8Array
): string {
  let hash = 0x811c9dc5;
  hash ^= compressionType & 0xff;
  hash = Math.imul(hash, 0x01000193);
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}:${bytes.length}`;
}

function fingerprintImportedChunks(chunks: readonly ImportedChunkData[]): string {
  let hash = 0x811c9dc5;
  const source = chunks
    .map((chunk) => `${chunk.id}:${chunk.contentFingerprint ?? chunk.blocks.length}`)
    .sort()
    .join("|");
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `chunks-v1:${(hash >>> 0).toString(16).padStart(8, "0")}:${chunks.length}`;
}

function yieldToBrowser(signal: AbortSignal): Promise<void> {
  throwIfOperationAborted(signal);
  return new Promise((resolve, reject) => {
    const timerId = globalThis.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, 0);
    const onAbort = () => {
      globalThis.clearTimeout(timerId);
      reject(operationAbortReason(signal));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
