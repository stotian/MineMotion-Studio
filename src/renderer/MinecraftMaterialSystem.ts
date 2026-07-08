import * as THREE from "three";
import { getBlockDefinition } from "../minecraft/BlockPalette";
import type { BlockId } from "../minecraft/MinecraftWorldTypes";

const materialCache = new Map<BlockId, THREE.MeshStandardMaterial>();

export function getMaterialForBlock(
  blockId: BlockId
): THREE.MeshStandardMaterial {
  const cached = materialCache.get(blockId);
  if (cached) {
    return cached;
  }

  const block = getBlockDefinition(blockId);
  const material = new THREE.MeshStandardMaterial({
    color: block.color,
    roughness: 0.92,
    metalness: 0,
    transparent: block.transparent,
    opacity: block.opacity
  });

  materialCache.set(blockId, material);
  return material;
}

export function createSolidMaterial(
  color: string,
  options: Partial<THREE.MeshStandardMaterialParameters> = {}
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.86,
    metalness: 0,
    ...options
  });
}

