import { createId } from "../../core/ids/Id";
import type { AssetCleanupRecord, AssetLibraryData, AssetRecord } from "./AssetRecord";

export interface AssetCleanupPreview {
  removable: AssetRecord[];
  protected: AssetRecord[];
  estimatedBytes: number;
  reasons: Record<string, string>;
}

export function previewUnusedAssetCleanup(library: AssetLibraryData): AssetCleanupPreview {
  const removable: AssetRecord[] = [];
  const protectedAssets: AssetRecord[] = [];
  const reasons: Record<string, string> = {};
  for (const record of library.records) {
    if (record.references.length > 0) {
      protectedAssets.push(record);
      reasons[record.id] = `${record.references.length} project reference(s)`;
    } else if (record.favorite) {
      protectedAssets.push(record);
      reasons[record.id] = "favorite";
    } else if (record.storagePolicy === "referenced" && record.integrity.status !== "missing") {
      protectedAssets.push(record);
      reasons[record.id] = "external source kept by policy";
    } else {
      removable.push(record);
      reasons[record.id] = record.integrity.status === "missing" ? "missing and unused" : "unused";
    }
  }
  return {
    removable,
    protected: protectedAssets,
    estimatedBytes: removable.reduce((sum, record) => sum + record.sizeBytes, 0),
    reasons
  };
}

export function applyAssetCleanup(
  library: AssetLibraryData,
  assetIds: readonly string[],
  reason = "User-confirmed unused asset cleanup",
  timestamp = new Date().toISOString()
): AssetLibraryData {
  const selected = new Set(assetIds);
  const removable = new Set(previewUnusedAssetCleanup(library).removable.map((record) => record.id));
  const removedAssetIds = [...selected].filter((id) => removable.has(id));
  if (removedAssetIds.length === 0) return library;
  const record: AssetCleanupRecord = {
    id: createId("asset-cleanup"),
    createdAt: timestamp,
    removedAssetIds,
    reason
  };
  return {
    ...library,
    records: library.records.filter((asset) => !removedAssetIds.includes(asset.id)),
    recentAssetIds: library.recentAssetIds.filter((id) => !removedAssetIds.includes(id)),
    cleanupHistory: [...library.cleanupHistory, record].slice(-25)
  };
}

export function restoreLastAssetCleanup(
  current: AssetLibraryData,
  previousRecords: readonly AssetRecord[]
): AssetLibraryData {
  const cleanup = current.cleanupHistory.at(-1);
  if (!cleanup) return current;
  const currentIds = new Set(current.records.map((record) => record.id));
  const restored = previousRecords.filter((record) => cleanup.removedAssetIds.includes(record.id) && !currentIds.has(record.id));
  return {
    ...current,
    records: [...current.records, ...restored],
    cleanupHistory: current.cleanupHistory.slice(0, -1)
  };
}
