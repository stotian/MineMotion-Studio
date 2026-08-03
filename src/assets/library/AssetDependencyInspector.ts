import type { AssetLibraryData, AssetRecord } from "./AssetRecord";

export interface AssetDependencyNode {
  asset: AssetRecord;
  dependencyCount: number;
  dependents: string[];
  portable: boolean;
  issues: string[];
}

export interface AssetDependencyReport {
  nodes: AssetDependencyNode[];
  missing: AssetRecord[];
  external: AssetRecord[];
  duplicates: string[][];
  packageBytes: number;
}

export function inspectAssetDependencies(library: AssetLibraryData): AssetDependencyReport {
  const byHash = new Map<string, string[]>();
  for (const record of library.records) {
    if (!record.hash) continue;
    const group = byHash.get(record.hash) ?? [];
    group.push(record.id);
    byHash.set(record.hash, group);
  }
  const nodes = library.records.map((asset): AssetDependencyNode => {
    const issues: string[] = [];
    if (asset.integrity.status !== "verified") issues.push(asset.integrity.message ?? asset.integrity.status);
    if (asset.storagePolicy === "referenced") issues.push("External source required for full portability.");
    if (!asset.packagePath && asset.storagePolicy !== "referenced") issues.push("No package path assigned.");
    return {
      asset,
      dependencyCount: asset.references.length,
      dependents: asset.references.map((reference) => reference.label ?? reference.ownerId),
      portable: asset.storagePolicy !== "referenced" && asset.integrity.status === "verified",
      issues
    };
  });
  return {
    nodes,
    missing: library.records.filter((asset) => asset.integrity.status === "missing" || asset.missing),
    external: library.records.filter((asset) => asset.storagePolicy === "referenced"),
    duplicates: [...byHash.values()].filter((group) => group.length > 1),
    packageBytes: library.records
      .filter((asset) => asset.storagePolicy === "embedded" || asset.storagePolicy === "cached")
      .reduce((sum, asset) => sum + asset.sizeBytes, 0)
  };
}
