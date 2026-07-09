import type { ImportedWorldSummary } from "../../project/ProjectFile";
import { ChunkReader } from "./ChunkReader";
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
import { decompressMcaPayload } from "./AnvilRegionReader";
import { NbtReader } from "./NbtReader";
import { createWorldImportProgress, type WorldImportProgress } from "./WorldImportProgress";

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
  world: ImportedWorldSummary;
  chunks: ImportedChunkData[];
  estimate: WorldImportPerformanceEstimate;
}

export class WorldImportManager {
  static async scan(files: FileList | File[]): Promise<MinecraftWorldScan> {
    return await MinecraftWorldScanner.scan(files);
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
    onProgress: (progress: WorldImportProgress) => void;
    isCancelled: () => boolean;
  }): Promise<WorldImportResult> {
    const { scan, importOptions, onProgress, isCancelled } = options;
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

    onProgress(
      createWorldImportProgress({
        status: "reading-regions",
        total: selectedRegions.length,
        message: `Reading ${selectedRegions.length} region files.`
      })
    );

    for (const [regionIndex, region] of selectedRegions.entries()) {
      if (isCancelled()) {
        throw new Error("World import cancelled.");
      }

      try {
        const buffer = await region.file.arrayBuffer();
        const header = McaFileReader.readHeader(
          buffer,
          region.regionX ?? 0,
          region.regionZ ?? 0
        );
        const locations = chooseChunkLocations(header.locations, importOptions);
        totalCandidates = Math.max(totalCandidates, locations.length);

        for (const [chunkIndex, location] of locations.entries()) {
          if (isCancelled()) {
            throw new Error("World import cancelled.");
          }
          if (chunks.length >= importOptions.maxChunks) break;

          onProgress(
            createWorldImportProgress({
              status: "reading-chunks",
              current: chunks.length + 1,
              total: importOptions.maxChunks,
              message: `Reading chunk ${location.chunkX}, ${location.chunkZ}.`
            })
          );

          try {
            const payload = McaFileReader.readChunkPayload(buffer, location);
            const decompressed = await decompressMcaPayload(
              payload.data,
              payload.compressionType
            );
            const tag = NbtReader.parseUncompressed(decompressed);
            const chunk = ChunkReader.readChunk({
              tag,
              dimension: importOptions.dimension,
              fallbackChunkX: location.chunkX,
              fallbackChunkZ: location.chunkZ,
              regionX: header.regionX,
              regionZ: header.regionZ,
              maxVerticalSections: importOptions.maxVerticalSections
            });
            chunks.push(chunk);
            for (const name of Object.keys(chunk.unknownBlocks)) {
              unknownBlockMappings[name] = "unknown";
            }
            warnings.push(...chunk.warnings);
          } catch (error) {
            warnings.push(
              error instanceof Error
                ? `Chunk ${location.chunkX},${location.chunkZ}: ${error.message}`
                : `Chunk ${location.chunkX},${location.chunkZ}: unreadable chunk.`
            );
          }

          await yieldToBrowser();
        }
      } catch (error) {
        warnings.push(
          error instanceof Error
            ? `Region ${region.path}: ${error.message}`
            : `Region ${region.path}: unreadable region.`
        );
      }

      onProgress(
        createWorldImportProgress({
          status: "reading-regions",
          current: regionIndex + 1,
          total: selectedRegions.length,
          message: `Finished region ${region.path}.`
        })
      );
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

    onProgress(
      createWorldImportProgress({
        status: "complete",
        current: chunks.length,
        total: importOptions.maxChunks,
        message: `Imported ${chunks.length} chunks with ${importedBlocks} blocks.`
      })
    );

    return { world, chunks, estimate };
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

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, 0));
}
