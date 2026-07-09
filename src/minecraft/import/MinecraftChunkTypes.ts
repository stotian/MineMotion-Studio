import type { BlockId } from "../MinecraftWorldTypes";

export type MinecraftDimensionId = "overworld" | "nether" | "end";

export interface MinecraftRegionFileRef {
  path: string;
  file: File;
  dimension: MinecraftDimensionId;
  regionX: number | null;
  regionZ: number | null;
  chunkLocations: number;
  estimatedChunks: number;
}

export interface MinecraftDimensionScan {
  id: MinecraftDimensionId;
  label: string;
  regionFiles: MinecraftRegionFileRef[];
  estimatedChunks: number;
}

export interface MinecraftLevelDatSummary {
  found: boolean;
  levelName: string;
  dataVersion: number | null;
  spawn: [number, number, number] | null;
  warnings: string[];
}

export interface MinecraftWorldScan {
  sourceName: string;
  levelDat: File | null;
  level: MinecraftLevelDatSummary;
  dimensions: MinecraftDimensionScan[];
  warnings: string[];
}

export interface MinecraftBlockSample {
  id: BlockId;
  minecraftName: string;
  x: number;
  y: number;
  z: number;
}

export interface ImportedChunkData {
  id: string;
  dimension: MinecraftDimensionId;
  regionX: number;
  regionZ: number;
  chunkX: number;
  chunkZ: number;
  minY: number;
  maxY: number;
  sectionsRead: number;
  blocks: MinecraftBlockSample[];
  unknownBlocks: Record<string, number>;
  warnings: string[];
}

export interface ImportedChunkRange {
  dimension: MinecraftDimensionId;
  centerChunkX: number;
  centerChunkZ: number;
  radiusChunks: number;
  maxChunks: number;
  maxRegionFiles: number;
  maxVerticalSections: number;
}

export interface WorldImportPerformanceEstimate {
  regionFiles: number;
  estimatedChunks: number;
  importedChunks: number;
  importedBlocks: number;
  visibleBlocks: number;
  estimatedMemoryBytes: number;
  warnings: string[];
}

export interface WorldRenderOptions {
  showChunkBorders: boolean;
  showWorldOrigin: boolean;
}
