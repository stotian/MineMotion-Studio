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
  chunks: readonly ChunkRenderObject[];
  helpers: THREE.Group | null;
}

export interface ChunkRenderObject {
  object: THREE.Group;
  chunkX: number;
  chunkZ: number;
  visibleBlocks: number;
}

export interface ChunkMeshBuildOptions {
  showChunkBorders: boolean;
  showWorldOrigin: boolean;
  materialContext?: MinecraftMaterialContext;
  /**
   * Record each instance's block coordinate on the mesh userData so the
   * experimental Build Sequencer can reveal blocks over time. Off by default to
   * avoid the per-instance memory cost when the feature is inactive.
   */
  captureBlockPositions?: boolean;
}

export type ImportedChunkSource = Pick<
  ImportedChunkData,
  "id" | "chunkX" | "chunkZ" | "blocks"
>;
