import type { ImportedWorldSummary } from "../../project/ProjectFile";
import { MinecraftWorldScanner } from "./MinecraftWorldScanner";
import type {
  ImportedChunkData,
  ImportedChunkRange,
  MinecraftDimensionId,
  MinecraftRegionFileRef,
  MinecraftWorldScan,
  WorldImportPerformanceEstimate,
  WorldRenderOptions
} from "./MinecraftChunkTypes";
import { McaFileReader } from "./McaFileReader";
import { createWorldImportProgress, type WorldImportProgress } from "./WorldImportProgress";
import { WorldChunkDecodeClient } from "./WorldChunkDecodeClient";
import {
  isOperationAborted,
  operationAbortReason,
  throwIfOperationAborted
} from "../../core/async/LatestOperationController";

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

export interface WorldImportResult {
  operationId: number;
  world: ImportedWorldSummary;
  chunks: ImportedChunkData[];
  estimate: WorldImportPerformanceEstimate;
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
  }): Promise<WorldImportResult> {
    const {
      scan,
      importOptions,
      operationId,
      signal,
      onProgress
    } = options;
    throwIfOperationAborted(signal);
    const dimension = scan.dimensions.find(
      (item) => item.id === importOptions.dimension
    );
    if (!dimension) {
      throw new Error(`Dimension ${importOptions.dimension} was not found.`);
    }

    const selectedRegions = chooseRegionFiles(
      dimension.regionFiles,
      importOptions
    );
    const chunks: ImportedChunkData[] = [];
    const warnings = [...scan.warnings];
    const unknownBlockMappings: Record<string, string> = {};
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
          const locations = chooseChunkLocations(
            header.locations,
            importOptions
          );
          totalCandidates = Math.max(totalCandidates, locations.length);

          for (const location of locations) {
            throwIfOperationAborted(signal);
            if (chunks.length >= importOptions.maxChunks) break;

            reportProgress({
              status: "reading-chunks",
              current: chunks.length + 1,
              total: importOptions.maxChunks,
              message: `Reading chunk ${location.chunkX}, ${location.chunkZ}.`
            });

            try {
              const payload = McaFileReader.readChunkPayload(buffer, location);
              const chunk = await chunkDecoder.decode(
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
              chunks.push(chunk);
              for (const name of Object.keys(chunk.unknownBlocks)) {
                unknownBlockMappings[name] = "unknown";
              }
              warnings.push(...chunk.warnings);
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

    const importedBlocks = chunks.reduce(
      (sum, chunk) => sum + chunk.blocks.length,
      0
    );
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

    const world: ImportedWorldSummary = {
      ...WorldImportManager.createSummaryFromScan(scan, importOptions),
      selectedDimension: importOptions.dimension,
      importedChunkRanges: [importRange],
      importedChunks: importOptions.embedImportedChunkCache ? chunks : [],
      unknownBlockMappings,
      unknownBlockCount,
      importSettings: importRange,
      performanceEstimate: estimate,
      cachedMesh: {
        embedded: importOptions.embedImportedChunkCache,
        generatedAt: new Date().toISOString(),
        chunkCount: chunks.length,
        blockCount: importedBlocks
      },
      renderOptions,
      notes: [...new Set(warnings)].slice(0, 100)
    };

    reportProgress({
      status: "complete",
      current: chunks.length,
      total: importOptions.maxChunks,
      message: `Imported ${chunks.length} chunks with ${importedBlocks} blocks.`
    });

    return { operationId, world, chunks, estimate };
  }
}

function snapshotOptions(options: WorldChunkImportOptions): ImportedChunkRange {
  return {
    dimension: options.dimension,
    centerChunkX: Math.round(options.centerChunkX),
    centerChunkZ: Math.round(options.centerChunkZ),
    radiusChunks: Math.max(0, Math.round(options.radiusChunks)),
    maxChunks: Math.max(1, Math.round(options.maxChunks)),
    maxRegionFiles: Math.max(1, Math.round(options.maxRegionFiles)),
    maxVerticalSections: Math.max(1, Math.round(options.maxVerticalSections))
  };
}

function chooseRegionFiles(
  regions: MinecraftRegionFileRef[],
  options: WorldChunkImportOptions
): MinecraftRegionFileRef[] {
  const centerRegionX = Math.floor(options.centerChunkX / 32);
  const centerRegionZ = Math.floor(options.centerChunkZ / 32);
  return [...regions]
    .sort((a, b) => {
      const aDistance = regionDistance(a, centerRegionX, centerRegionZ);
      const bDistance = regionDistance(b, centerRegionX, centerRegionZ);
      return aDistance - bDistance;
    })
    .slice(0, Math.max(1, options.maxRegionFiles));
}

function chooseChunkLocations(
  locations: Array<{
    chunkX: number;
    chunkZ: number;
    offsetSector: number;
    sectorCount: number;
    localX: number;
    localZ: number;
    timestamp: number;
  }>,
  options: WorldChunkImportOptions
) {
  return locations
    .filter(
      (location) =>
        Math.abs(location.chunkX - options.centerChunkX) <= options.radiusChunks &&
        Math.abs(location.chunkZ - options.centerChunkZ) <= options.radiusChunks
    )
    .sort((a, b) => {
      const aDistance = chunkDistance(a, options.centerChunkX, options.centerChunkZ);
      const bDistance = chunkDistance(b, options.centerChunkX, options.centerChunkZ);
      return aDistance - bDistance;
    })
    .slice(0, Math.max(1, options.maxChunks));
}

function regionDistance(
  region: MinecraftRegionFileRef,
  centerRegionX: number,
  centerRegionZ: number
): number {
  return (
    Math.abs((region.regionX ?? 0) - centerRegionX) +
    Math.abs((region.regionZ ?? 0) - centerRegionZ)
  );
}

function chunkDistance(
  location: { chunkX: number; chunkZ: number },
  centerChunkX: number,
  centerChunkZ: number
): number {
  return (
    Math.abs(location.chunkX - centerChunkX) +
    Math.abs(location.chunkZ - centerChunkZ)
  );
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
