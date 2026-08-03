import type { AssetLibraryData, AssetRecord, AssetStoragePolicy, AssetType } from "./AssetRecord";

export type AssetViewMode = "grid" | "list";
export type AssetSort = "name" | "type" | "size" | "imported" | "recent";

export interface AssetQuery {
  search: string;
  types: AssetType[];
  policies: AssetStoragePolicy[];
  favoritesOnly: boolean;
  missingOnly: boolean;
  sort: AssetSort;
  direction: "asc" | "desc";
}

export const DEFAULT_ASSET_QUERY: AssetQuery = {
  search: "",
  types: [],
  policies: [],
  favoritesOnly: false,
  missingOnly: false,
  sort: "name",
  direction: "asc"
};

export function queryAssets(library: AssetLibraryData, query: AssetQuery): AssetRecord[] {
  const search = query.search.trim().toLocaleLowerCase();
  const recentIndex = new Map(library.recentAssetIds.map((id, index) => [id, index]));
  const records = library.records.filter((record) => {
    if (query.types.length && !query.types.includes(record.type)) return false;
    if (query.policies.length && !query.policies.includes(record.storagePolicy)) return false;
    if (query.favoritesOnly && !record.favorite) return false;
    if (query.missingOnly && record.integrity.status !== "missing" && !record.missing) return false;
    if (!search) return true;
    return [record.name, record.type, record.source.displayPath, record.tags.join(" ")]
      .some((value) => value.toLocaleLowerCase().includes(search));
  });
  const multiplier = query.direction === "asc" ? 1 : -1;
  return records.sort((left, right) => multiplier * compare(left, right, query.sort, recentIndex));
}

function compare(left: AssetRecord, right: AssetRecord, sort: AssetSort, recentIndex: Map<string, number>): number {
  if (sort === "size") return left.sizeBytes - right.sizeBytes || left.name.localeCompare(right.name);
  if (sort === "imported") return left.importedAt.localeCompare(right.importedAt) || left.name.localeCompare(right.name);
  if (sort === "recent") return (recentIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (recentIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER);
  if (sort === "type") return left.type.localeCompare(right.type) || left.name.localeCompare(right.name);
  return left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: "base" });
}
