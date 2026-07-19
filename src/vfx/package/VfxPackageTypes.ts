import type { VfxAuthoringDocument } from "../authoring/VfxAuthoringTypes";

export const VFX_PACKAGE_FORMAT = "minemotion-vfx" as const;
export const VFX_PACKAGE_MANIFEST_VERSION = 1 as const;
export const VFX_PACKAGE_MANIFEST_PATH = "manifest.json";
export const VFX_PACKAGE_EFFECT_PATH = "effect.json";

export const VFX_PACKAGE_LIMITS = Object.freeze({
  archiveBytes: 32 * 1024 * 1024,
  entries: 256,
  entryBytes: 16 * 1024 * 1024,
  totalUncompressedBytes: 64 * 1024 * 1024,
  pathBytes: 512,
  compressionRatio: 100,
  assets: 128,
  dependencies: 32,
  imageDimension: 4096
});

export type VfxPackagePermission =
  | "asset-textures"
  | "asset-audio"
  | "asset-models"
  | "restricted-shader-templates";

export type VfxPackageAssetKind =
  | "texture"
  | "sprite"
  | "audio"
  | "model"
  | "gradient"
  | "curve"
  | "thumbnail"
  | "localization"
  | "restricted-shader-template";

export interface VfxPackageDependency {
  id: string;
  versionRange: string;
  optional: boolean;
}

export interface VfxPackageAssetManifest {
  id: string;
  path: string;
  kind: VfxPackageAssetKind;
  mimeType: string;
  byteLength: number;
  width?: number;
  height?: number;
  license?: string;
}

export interface VfxPackageManifestV1 {
  format: typeof VFX_PACKAGE_FORMAT;
  manifestVersion: typeof VFX_PACKAGE_MANIFEST_VERSION;
  packageVersion: string;
  minStudioVersion: string;
  id: string;
  displayName: string;
  description: string;
  author: string;
  license: string;
  effect: {
    path: typeof VFX_PACKAGE_EFFECT_PATH;
    documentId: string;
  };
  dependencies: readonly VfxPackageDependency[];
  permissions: readonly VfxPackagePermission[];
  assets: readonly VfxPackageAssetManifest[];
}

export interface VfxPackageArchiveEntry {
  path: string;
  bytes: Uint8Array;
  compressedSize: number;
  uncompressedSize: number;
}

export interface VfxPackageArchive {
  manifest: VfxPackageManifestV1;
  document: VfxAuthoringDocument;
  entries: readonly VfxPackageArchiveEntry[];
}
