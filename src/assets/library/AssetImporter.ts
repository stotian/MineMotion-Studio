import type { AssetRecord } from "./AssetRecord";

export function createExternalAssetRecord(
  file: File,
  type: AssetRecord["type"],
  packagePath: string
): AssetRecord {
  return {
    id: `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    type,
    sourcePath: file.name,
    packagePath,
    sizeBytes: file.size,
    mimeType: file.type,
    importedAt: new Date().toISOString(),
    hash: "",
    missing: false
  };
}
