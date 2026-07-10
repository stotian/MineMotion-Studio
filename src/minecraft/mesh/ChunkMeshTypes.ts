import type * as THREE from "three";
import type { ImportedChunkData } from "../import/MinecraftChunkTypes";
import type { BlockId } from "../MinecraftWorldTypes";
import type { MinecraftMaterialContext } from "../../renderer/MinecraftMaterialSystem";

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
  materialContext?: MinecraftMaterialContext;
}

export type ImportedChunkSource = Pick<
  ImportedChunkData,
  "id" | "chunkX" | "chunkZ" | "blocks"
>;
