import type { BlockId } from "../MinecraftWorldTypes";
import type { MinecraftMaterialSettings } from "../materials/MinecraftMaterialTypes";

export type ResourcePackSourceKind = "zip" | "folder";

export interface ResourcePackEntry {
  path: string;
  bytes: Uint8Array;
}

export interface ResourcePackMetadata {
  packFormat: number | null;
  description: string;
  hasPackMetadata: boolean;
}

export interface ResourcePackAnimationFrame {
  index: number;
  timeTicks?: number;
}

export interface ResourcePackAnimationMetadata {
  frameTimeTicks: number;
  interpolate: boolean;
  frames: ResourcePackAnimationFrame[];
}

export interface ScannedResourcePackTexture {
  path: string;
  blockName: string;
  bytes: Uint8Array;
  animated: boolean;
  animation: ResourcePackAnimationMetadata | null;
}

export interface ResourcePackScanResult {
  rootPath: string;
  metadata: ResourcePackMetadata;
  textures: ScannedResourcePackTexture[];
  warnings: string[];
}

export interface ResourcePackTextureAsset {
  id: string;
  path: string;
  blockName: string;
  mimeType: "image/png";
  dataUrl: string;
  byteLength: number;
  animated: boolean;
  animation?: ResourcePackAnimationMetadata | null;
}

export interface MissingTextureResolution {
  blockId: BlockId;
  face: BlockTextureFace;
  reason: string;
}

export interface ResourcePackResolutionReport {
  resolvedFaces: number;
  fallbackFaces: number;
  missing: MissingTextureResolution[];
}

export interface ResourcePackAsset {
  id: string;
  name: string;
  sourceKind: ResourcePackSourceKind;
  metadata: ResourcePackMetadata;
  textures: ResourcePackTextureAsset[];
  importedAt: string;
  warnings: string[];
  resolutionReport?: ResourcePackResolutionReport;
}

export interface TextureResolution {
  status: "resolved" | "fallback";
  blockId: BlockId;
  face: BlockTextureFace;
  texture: ResourcePackTextureAsset | null;
  fallbackColor: string;
  reason: string;
}

export type BlockTextureFace =
  | "all"
  | "side"
  | "top"
  | "bottom"
  | "front"
  | "back";

export interface WaterRenderSettings {
  opacity: number;
  roughness: number;
  animationSpeed: number;
  emissiveIntensity: number;
}

export interface MinecraftResourceSettings {
  activeResourcePackId: string | null;
  textureFiltering: "nearest" | "linear";
  biomeTint: BiomeTintSettings;
  materials: MinecraftMaterialSettings;
  water: WaterRenderSettings;
}

export type BiomeTintPresetId =
  | "plains"
  | "forest"
  | "swamp"
  | "desert"
  | "custom";

export interface BiomeTintSettings {
  enabled: boolean;
  presetId: BiomeTintPresetId;
  grassColor: string;
  foliageColor: string;
  waterColor: string;
}
