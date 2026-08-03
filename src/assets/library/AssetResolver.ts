import type { AssetLibraryData, AssetRecord } from "./AssetRecord";

export function findAssetRecord(
  library: AssetLibraryData,
  assetId: string
): AssetRecord | null {
  return library.records.find((asset) => asset.id === assetId) ?? null;
}

export function findAssetByPackagePath(library: AssetLibraryData, packagePath: string): AssetRecord | null {
  return library.records.find((asset) => asset.packagePath === packagePath) ?? null;
}

export function resolveAssetUsability(record: AssetRecord): { usable: boolean; reason?: string } {
  if (record.integrity.status === "missing" || record.missing) return { usable: false, reason: "Asset source is missing." };
  if (record.integrity.status === "corrupt") return { usable: false, reason: record.integrity.message ?? "Asset failed integrity validation." };
  if (record.storagePolicy !== "referenced" && !record.packagePath) return { usable: false, reason: "Embedded asset has no package path." };
  return { usable: true };
}
