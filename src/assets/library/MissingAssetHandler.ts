import type { AssetLibraryData } from "./AssetRecord";

export function getMissingAssetWarnings(library: AssetLibraryData): string[] {
  return library.records
    .filter((asset) => asset.missing || asset.integrity.status === "missing" || asset.integrity.status === "corrupt")
    .map((asset) => `${asset.integrity.status === "corrupt" ? "Corrupt" : "Missing"} asset: ${asset.name} (${asset.type})`);
}
