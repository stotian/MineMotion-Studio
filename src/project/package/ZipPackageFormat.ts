import type { MineMotionPackageData } from "./PackageTypes";

export const MINEMOTION_ZIP_FORMAT = "minemotion-zip";
export const MINEMOTION_ZIP_SCHEMA_VERSION = 1;
export type PackageAssetCategory = keyof MineMotionPackageData["assets"];
export interface ZipPackageAssetIndexEntry { category: PackageAssetCategory; path: string; }
export interface ZipPackageIndex {
  format: typeof MINEMOTION_ZIP_FORMAT;
  schemaVersion: typeof MINEMOTION_ZIP_SCHEMA_VERSION;
  projectEntry: "project.json";
  manifestEntry: "manifest.json";
  metadataEntry: "assets/metadata.json";
  assets: ZipPackageAssetIndexEntry[];
}
