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

export interface ScannedResourcePackTexture {
  path: string;
  blockName: string;
  bytes: Uint8Array;
  animated: boolean;
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
}

export interface ResourcePackAsset {
  id: string;
  name: string;
  sourceKind: ResourcePackSourceKind;
  metadata: ResourcePackMetadata;
  textures: ResourcePackTextureAsset[];
  importedAt: string;
  warnings: string[];
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

export interface MinecraftResourceSettings {
  activeResourcePackId: string | null;
  textureFiltering: "nearest" | "linear";
  biomeTint: BiomeTintSettings;
  materials: MinecraftMaterialSettings;
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
