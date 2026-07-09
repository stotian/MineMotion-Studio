export type AssetType =
  | "objModel"
  | "audio"
  | "texture"
  | "image"
  | "worldReference"
  | "worldCache"
  | "preset"
  | "pluginAsset";

export interface AssetRecord {
  id: string;
  name: string;
  type: AssetType;
  sourcePath: string;
  packagePath: string;
  sizeBytes: number;
  mimeType: string;
  importedAt: string;
  hash: string;
  missing: boolean;
}

export interface AssetLibraryData {
  records: AssetRecord[];
  warnings: string[];
}
