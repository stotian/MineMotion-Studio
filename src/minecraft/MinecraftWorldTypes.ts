import type { Vector3Tuple } from "../core/scene/SceneTypes";

/**
 * A namespaced block id, e.g. "minecraft:stone" or "create:cogwheel".
 *
 * Open by design: Minecraft ships around a thousand blocks and every mod adds
 * more, so the set cannot be enumerated at compile time. Definitions live in
 * the runtime BlockRegistry, which normalises bare ids ("stone") into the
 * minecraft namespace so projects written before this change keep loading.
 */
export type BlockId = string;

/** Ids the core terrain and importer rely on being present. */
export const CORE_BLOCK_IDS = [
  "air",
  "grass_block",
  "dirt",
  "stone",
  "cobblestone",
  "deepslate",
  "oak_log",
  "oak_leaves",
  "water",
  "lava",
  "glass",
  "glowstone",
  "torch",
  "redstone_lamp",
  "sand",
  "gravel",
  "snow",
  "netherrack",
  "end_stone"
] as const;

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
