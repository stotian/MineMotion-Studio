import type { Vector3Tuple } from "../core/scene/SceneTypes";

export type BlockId =
  | "air"
  | "grass"
  | "grass_block"
  | "dirt"
  | "stone"
  | "cobblestone"
  | "deepslate"
  | "oak_log"
  | "oak_leaves"
  | "water"
  | "lava"
  | "glass"
  | "glowstone"
  | "torch"
  | "redstone_lamp"
  | "sand"
  | "gravel"
  | "snow"
  | "netherrack"
  | "end_stone"
  | "ore"
  | "unknown";

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
  dimension: string;
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
