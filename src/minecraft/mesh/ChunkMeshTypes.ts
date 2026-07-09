import type * as THREE from "three";
import type { ImportedChunkData } from "../import/MinecraftChunkTypes";
import type { BlockId } from "../MinecraftWorldTypes";

export type BlockFaceDirection = "east" | "west" | "up" | "down" | "south" | "north";

export interface VisibleBlockSample {
  id: BlockId;
  minecraftName: string;
  x: number;
  y: number;
  z: number;
  exposedFaces: BlockFaceDirection[];
}

export interface ChunkMeshBuildResult {
  object: THREE.Group;
  visibleBlocks: number;
  chunkCount: number;
}

export interface ChunkMeshBuildOptions {
  showChunkBorders: boolean;
  showWorldOrigin: boolean;
}

export type ImportedChunkSource = Pick<
  ImportedChunkData,
  "id" | "chunkX" | "chunkZ" | "blocks"
>;
