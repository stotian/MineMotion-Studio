export type AssetType =
  | "objModel"
  | "gltfModel"
  | "audio"
  | "texture"
  | "image"
  | "minecraftSkin"
  | "blockbenchModel"
  | "resourcePack"
  | "worldReference"
  | "worldCache"
  | "vfxPreset"
  | "rigPose"
  | "animationClip"
  | "projectTemplate"
  | "preset"
  | "pluginAsset";

export type AssetStoragePolicy = "embedded" | "referenced" | "cached" | "generated";
export type AssetIntegrityStatus = "verified" | "unverified" | "missing" | "corrupt";
export type AssetReferenceKind = "scene" | "timeline" | "rig" | "effect" | "package" | "template";

export interface AssetSourceDescriptor {
  kind: "file" | "directory" | "builtin" | "generated" | "package";
  displayPath: string;
  portablePath?: string;
  lastModified?: number;
}

export interface AssetReference {
  ownerId: string;
  kind: AssetReferenceKind;
  label?: string;
}

export interface AssetIntegrity {
  status: AssetIntegrityStatus;
  checkedAt: string;
  expectedHash?: string;
  message?: string;
}

export interface AssetThumbnail {
  status: "pending" | "ready" | "failed";
  dataUrl?: string;
  generatedAt?: string;
  error?: string;
}

export interface AssetRecord {
  id: string;
  name: string;
  type: AssetType;
  sourcePath: string;
  packagePath: string;
  sizeBytes: number;
  mimeType: string;
  importedAt: string;
  hash: string;
  missing: boolean;
  storagePolicy: AssetStoragePolicy;
  source: AssetSourceDescriptor;
  references: AssetReference[];
  integrity: AssetIntegrity;
  favorite: boolean;
  lastUsedAt?: string;
  tags: string[];
  thumbnail?: AssetThumbnail;
  metadata: Record<string, string | number | boolean | null>;
}

export interface AssetLibraryData {
  schemaVersion: 2;
  records: AssetRecord[];
  warnings: string[];
  recentAssetIds: string[];
  cleanupHistory: AssetCleanupRecord[];
}

export interface AssetCleanupRecord {
  id: string;
  createdAt: string;
  removedAssetIds: string[];
  reason: string;
}
