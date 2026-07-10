import type * as THREE from "three";
import {
  getMaterialForBlock,
  type MinecraftMaterialContext
} from "../../renderer/MinecraftMaterialSystem";
import type { BlockId } from "../MinecraftWorldTypes";

export class BlockMaterialResolver {
  static resolve(
    blockId: BlockId,
    context?: MinecraftMaterialContext
  ): THREE.MeshStandardMaterial {
    return getMaterialForBlock(blockId, context);
  }
}
