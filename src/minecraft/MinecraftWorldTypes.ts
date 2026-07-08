import type { Vector3Tuple } from "../project/ProjectFile";

export type BlockId =
  | "air"
  | "grass"
  | "dirt"
  | "stone"
  | "oak_log"
  | "oak_leaves"
  | "water"
  | "glass";

export interface BlockDefinition {
  id: BlockId;
  label: string;
  color: string;
  transparent: boolean;
  opacity: number;
}

export interface BlockSample {
  id: BlockId;
  position: Vector3Tuple;
}

export interface ChunkData {
  id: string;
  origin: Vector3Tuple;
  size: Vector3Tuple;
  blocks: BlockSample[];
}

export interface RegionFileSummary {
  path: string;
  dimension: "overworld" | "nether" | "end";
  regionX: number | null;
  regionZ: number | null;
  chunkLocations?: number;
}

export interface WorldFolderScanResult {
  sourceName: string;
  levelDat: File | null;
  overworldRegions: File[];
  netherRegions: File[];
  endRegions: File[];
  notes: string[];
}

