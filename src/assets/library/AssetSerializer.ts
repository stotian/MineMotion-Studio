import type { AssetLibraryData } from "./AssetRecord";

export function sanitizeAssetLibrary(
  library: Partial<AssetLibraryData> | undefined
): AssetLibraryData {
  return {
    records: Array.isArray(library?.records) ? library.records : [],
    warnings: Array.isArray(library?.warnings) ? library.warnings : []
  };
}
