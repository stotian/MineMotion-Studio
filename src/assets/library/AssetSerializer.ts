import type { AssetLibraryData } from "./AssetRecord";
import { normalizeAssetLibrary } from "./AssetCatalog";

export function sanitizeAssetLibrary(
  library: Partial<AssetLibraryData> | undefined
): AssetLibraryData {
  return normalizeAssetLibrary(library);
}
