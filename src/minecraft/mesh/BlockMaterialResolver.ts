import type * as THREE from "three";
import {
  getMaterialForBlock,
  type MinecraftMaterialContext
} from "../../renderer/MinecraftMaterialSystem";
import type { BlockId } from "../MinecraftWorldTypes";
import type { BlockTextureFace } from "../resources/ResourcePackTypes";

export class BlockMaterialResolver {
  static resolve(
    blockId: BlockId,
    context?: MinecraftMaterialContext,
    face: BlockTextureFace = "all"
  ): THREE.MeshStandardMaterial {
    return getMaterialForBlock(blockId, context, face);
  }
}
