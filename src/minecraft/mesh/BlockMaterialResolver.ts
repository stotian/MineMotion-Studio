import type * as THREE from "three";
import { getMaterialForBlock } from "../../renderer/MinecraftMaterialSystem";
import type { BlockId } from "../MinecraftWorldTypes";

export class BlockMaterialResolver {
  static resolve(blockId: BlockId): THREE.MeshStandardMaterial {
    return getMaterialForBlock(blockId);
  }
}
