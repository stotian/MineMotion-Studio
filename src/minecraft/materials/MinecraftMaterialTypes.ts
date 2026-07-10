import type { BlockId } from "../MinecraftWorldTypes";

export type MinecraftMaterialPresetId =
  | "solid"
  | "transparent"
  | "leaves"
  | "water"
  | "glass"
  | "torch-emissive"
  | "glowstone-emissive"
  | "lava-emissive"
  | "redstone-lamp-emissive";

export interface MinecraftMaterialPreset {
  id: MinecraftMaterialPresetId;
  name: string;
  description: string;
  roughness: number;
  metalness: number;
  transparent: boolean;
  opacity: number;
  alphaTest: number;
  depthWrite: boolean;
  emissiveColor: string;
  emissiveIntensity: number;
}

export interface MinecraftMaterialSettings {
  defaultPresetId: MinecraftMaterialPresetId;
  overrides: Partial<Record<BlockId, MinecraftMaterialPresetId>>;
}
