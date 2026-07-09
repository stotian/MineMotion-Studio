import type { AssetLibraryData, AssetRecord } from "./AssetRecord";

export function findAssetRecord(
  library: AssetLibraryData,
  assetId: string
): AssetRecord | null {
  return library.records.find((asset) => asset.id === assetId) ?? null;
}
