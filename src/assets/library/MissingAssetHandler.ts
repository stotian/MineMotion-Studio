import type { AssetLibraryData } from "./AssetRecord";

export function getMissingAssetWarnings(library: AssetLibraryData): string[] {
  return library.records
    .filter((asset) => asset.missing)
    .map((asset) => `Missing asset: ${asset.name} (${asset.type})`);
}
