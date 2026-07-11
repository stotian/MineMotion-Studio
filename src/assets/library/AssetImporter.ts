import type { AssetRecord } from "./AssetRecord";
import { createId } from "../../core/ids/Id";

export function createExternalAssetRecord(
  file: File,
  type: AssetRecord["type"],
  packagePath: string
): AssetRecord {
  return {
    id: createId("asset"),
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
