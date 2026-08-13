import type {
  AssetIntegrity,
  AssetLibraryData,
  AssetRecord,
  AssetSourceDescriptor,
  AssetStoragePolicy,
  AssetType
} from "./AssetRecord";

const CURRENT_ASSET_LIBRARY_SCHEMA = 2 as const;

type AssetLibraryInput = Omit<Partial<AssetLibraryData>, "records"> & {
  records?: Array<Partial<AssetRecord> & Pick<AssetRecord, "id" | "name" | "type">>;
};

export function createEmptyAssetLibrary(): AssetLibraryData {
  return {
    schemaVersion: CURRENT_ASSET_LIBRARY_SCHEMA,
    records: [],
    warnings: [],
    recentAssetIds: [],
    cleanupHistory: []
  };
}

export function normalizeAssetRecord(record: Partial<AssetRecord> & Pick<AssetRecord, "id" | "name" | "type">): AssetRecord {
  const sourcePath = typeof record.sourcePath === "string" ? record.sourcePath : record.name;
  const missing = Boolean(record.missing || record.integrity?.status === "missing");
  const storagePolicy = normalizeStoragePolicy(record.storagePolicy, record.type);
  const source: AssetSourceDescriptor = {
    kind: record.source?.kind ?? inferSourceKind(storagePolicy),
    displayPath: record.source?.displayPath ?? sourcePath,
    portablePath: record.source?.portablePath,
    lastModified: record.source?.lastModified
  };
  const integrity: AssetIntegrity = {
    status: missing ? "missing" : record.integrity?.status ?? (record.hash ? "verified" : "unverified"),
    checkedAt: record.integrity?.checkedAt ?? record.importedAt ?? new Date(0).toISOString(),
    expectedHash: record.integrity?.expectedHash ?? record.hash,
    message: record.integrity?.message
  };
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    sourcePath,
    packagePath: record.packagePath ?? "",
    sizeBytes: finiteNonNegative(record.sizeBytes),
    mimeType: record.mimeType ?? "application/octet-stream",
    importedAt: record.importedAt ?? new Date(0).toISOString(),
    hash: record.hash ?? "",
    missing,
    storagePolicy,
    source,
    references: Array.isArray(record.references) ? record.references.filter(isReference) : [],
    integrity,
    favorite: Boolean(record.favorite),
    lastUsedAt: typeof record.lastUsedAt === "string" ? record.lastUsedAt : undefined,
    tags: Array.isArray(record.tags) ? [...new Set(record.tags.filter((tag): tag is string => typeof tag === "string"))] : [],
    thumbnail: record.thumbnail,
    metadata: record.metadata && typeof record.metadata === "object" ? { ...record.metadata } : {}
  };
}

export function normalizeAssetLibrary(library: AssetLibraryInput | undefined): AssetLibraryData {
  const records = Array.isArray(library?.records)
    ? library.records.filter(hasIdentity).map((record) => normalizeAssetRecord(record))
    : [];
  const recordIds = new Set(records.map((record) => record.id));
  return {
    schemaVersion: CURRENT_ASSET_LIBRARY_SCHEMA,
    records,
    warnings: Array.isArray(library?.warnings)
      ? library.warnings.filter((warning): warning is string => typeof warning === "string")
      : [],
    recentAssetIds: Array.isArray(library?.recentAssetIds)
      ? library.recentAssetIds.filter((id): id is string => typeof id === "string" && recordIds.has(id)).slice(0, 30)
      : [],
    cleanupHistory: Array.isArray(library?.cleanupHistory)
      ? library.cleanupHistory.filter((entry) => Boolean(entry?.id && entry?.createdAt && Array.isArray(entry.removedAssetIds))).slice(-25)
      : []
  };
}

export function mergeAssetRecords(
  collected: readonly AssetRecord[],
  previous: AssetLibraryData | undefined
): AssetLibraryData {
  const normalizedPrevious = normalizeAssetLibrary(previous);
  const previousById = new Map(normalizedPrevious.records.map((record) => [record.id, record]));
  const records = collected.map((record) => {
    const prior = previousById.get(record.id);
    if (!prior) return normalizeAssetRecord(record);
    return normalizeAssetRecord({
      ...record,
      favorite: prior.favorite,
      lastUsedAt: prior.lastUsedAt,
      tags: prior.tags,
      source: record.source.displayPath ? record.source : prior.source,
      thumbnail: prior.hash === record.hash ? prior.thumbnail : undefined,
      metadata: { ...prior.metadata, ...record.metadata }
    });
  });
  const warnings = records.flatMap((record) =>
    record.integrity.status === "verified" ? [] : [record.integrity.message ?? `${record.name}: ${record.integrity.status}`]
  );
  return {
    ...normalizedPrevious,
    records,
    warnings: [...new Set([...normalizedPrevious.warnings, ...warnings])]
  };
}

export function touchAsset(library: AssetLibraryData, assetId: string, timestamp = new Date().toISOString()): AssetLibraryData {
  if (!library.records.some((record) => record.id === assetId)) return library;
  return {
    ...library,
    records: library.records.map((record) => record.id === assetId ? { ...record, lastUsedAt: timestamp } : record),
    recentAssetIds: [assetId, ...library.recentAssetIds.filter((id) => id !== assetId)].slice(0, 30)
  };
}

export function setAssetFavorite(library: AssetLibraryData, assetId: string, favorite: boolean): AssetLibraryData {
  return {
    ...library,
    records: library.records.map((record) => record.id === assetId ? { ...record, favorite } : record)
  };
}

function normalizeStoragePolicy(value: AssetStoragePolicy | undefined, type: AssetType): AssetStoragePolicy {
  if (value === "embedded" || value === "referenced" || value === "cached" || value === "generated") return value;
  if (type === "worldReference") return "referenced";
  if (type === "worldCache") return "cached";
  if (type === "preset" || type === "rigPose" || type === "animationClip" || type === "projectTemplate") return "generated";
  return "embedded";
}

function inferSourceKind(policy: AssetStoragePolicy): AssetSourceDescriptor["kind"] {
  if (policy === "generated") return "generated";
  if (policy === "cached") return "package";
  return "file";
}

function finiteNonNegative(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function hasIdentity(record: unknown): record is Partial<AssetRecord> & Pick<AssetRecord, "id" | "name" | "type"> {
  if (!record || typeof record !== "object") return false;
  const value = record as Record<string, unknown>;
  return typeof value.id === "string" && typeof value.name === "string" && typeof value.type === "string";
}

function isReference(value: unknown): value is AssetRecord["references"][number] {
  if (!value || typeof value !== "object") return false;
  const reference = value as Record<string, unknown>;
  return typeof reference.ownerId === "string" && typeof reference.kind === "string";
}
