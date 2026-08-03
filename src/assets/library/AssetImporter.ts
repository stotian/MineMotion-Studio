import type { AssetRecord } from "./AssetRecord";
import { createId } from "../../core/ids/Id";
import { createAssetHash } from "./AssetHash";
import { normalizeAssetRecord } from "./AssetCatalog";

export function createExternalAssetRecord(
  file: File,
  type: AssetRecord["type"],
  packagePath: string
): AssetRecord {
  return normalizeAssetRecord({
    id: createId("asset"),
    name: file.name,
    type,
    sourcePath: file.name,
    packagePath,
    sizeBytes: file.size,
    mimeType: file.type || "application/octet-stream",
    importedAt: new Date().toISOString(),
    hash: "",
    missing: false,
    storagePolicy: "embedded",
    source: { kind: "file", displayPath: file.name, lastModified: file.lastModified },
    references: [],
    integrity: { status: "unverified", checkedAt: new Date().toISOString() },
    favorite: false,
    tags: [],
    metadata: {}
  });
}

export async function finalizeExternalAssetRecord(record: AssetRecord, bytes: Uint8Array): Promise<AssetRecord> {
  const hash = await createAssetHash(bytes);
  return normalizeAssetRecord({
    ...record,
    hash,
    sizeBytes: bytes.byteLength,
    integrity: { status: "verified", checkedAt: new Date().toISOString(), expectedHash: hash }
  });
}
