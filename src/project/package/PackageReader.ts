import { decodePortableWorldChunkCache, parsePortableWorldChunkCache } from "../../minecraft/cache/WorldChunkCache";
import { ProjectSerializer } from "../ProjectSerializer";
import type { MineMotionProject } from "../ProjectFile";
import type { MineMotionPackageData } from "./PackageTypes";
import { validatePackageData } from "./PackageValidator";
import { looksLikeStoredZip, readStoredZip } from "./StoredZipReader";
import { MINEMOTION_ZIP_FORMAT, MINEMOTION_ZIP_SCHEMA_VERSION, type PackageAssetCategory, type ZipPackageIndex } from "./ZipPackageFormat";

const decoder = new TextDecoder("utf-8", { fatal: true });
export class PackageReader {
  static async read(file: File): Promise<MineMotionProject> { return PackageReader.parseBytes(new Uint8Array(await file.arrayBuffer())); }
  static parseBytes(bytes: Uint8Array): MineMotionProject {
    if (!looksLikeStoredZip(bytes)) return PackageReader.parse(decoder.decode(bytes));
    const map = new Map(readStoredZip(bytes).map((entry) => [entry.filename, entry.data]));
    const index = parseJson<ZipPackageIndex>(map, "package-index.json");
    if (index.format !== MINEMOTION_ZIP_FORMAT || index.schemaVersion !== MINEMOTION_ZIP_SCHEMA_VERSION) throw new Error("Unsupported .minemotion ZIP package version.");
    if (index.assets.length > 4096) throw new Error("Package asset index exceeds its safety limit.");
    const assets: MineMotionPackageData["assets"] = { models: {}, skins: {}, blockbench: {}, resourcePacks: {}, audio: {}, worldCaches: {}, thumbnails: {}, metadata: parseJson(map, index.metadataEntry) };
    const indexedPaths = new Set<string>();
    for (const item of index.assets) {
      if (!isAssetCategory(item.category) || item.category === "metadata") throw new Error(`Unsupported package asset category: ${item.category}.`);
      if (!isAssetPathForCategory(item.category, item.path)) throw new Error(`Package asset path does not match ${item.category}: ${item.path}.`);
      if (indexedPaths.has(item.path)) throw new Error(`Package asset index contains a duplicate path: ${item.path}.`);
      indexedPaths.add(item.path);
      const payload = map.get(item.path);
      if (!payload) throw new Error(`Package asset is missing: ${item.path}.`);
      (assets[item.category] as Record<string, string>)[item.path] = decoder.decode(payload);
    }
    return validateAndHydrate({ packageFormat: "minemotion-package-json", manifest: parseJson(map, index.manifestEntry), project: parseJson(map, index.projectEntry), assets });
  }
  static parse(raw: string): MineMotionProject { return validateAndHydrate(JSON.parse(raw) as MineMotionPackageData); }
  static looksLikePackage(raw: string): boolean { try { return (JSON.parse(raw) as Partial<MineMotionPackageData>).packageFormat === "minemotion-package-json"; } catch { return false; } }
}
function parseJson<T>(map: Map<string, Uint8Array>, path: string): T { const data = map.get(path); if (!data) throw new Error(`Package entry is missing: ${path}.`); return JSON.parse(decoder.decode(data)) as T; }
function isAssetCategory(value: string): value is PackageAssetCategory { return ["models", "skins", "blockbench", "resourcePacks", "audio", "worldCaches", "thumbnails", "metadata"].includes(value); }
function isAssetPathForCategory(category: Exclude<PackageAssetCategory, "metadata">, path: string): boolean {
  const prefixes: Record<Exclude<PackageAssetCategory, "metadata">, string> = {
    models: "assets/models/", skins: "assets/skins/", blockbench: "assets/blockbench/",
    resourcePacks: "assets/resource-packs/", audio: "audio/", worldCaches: "world/cache/",
    thumbnails: "assets/thumbnails/"
  };
  return path.startsWith(prefixes[category]);
}
function validateAndHydrate(data: MineMotionPackageData): MineMotionProject { const validation = validatePackageData(data); if (!validation.valid) throw new Error(validation.errors.join(" ")); return ProjectSerializer.parse(JSON.stringify(hydrateWorldCache(data))); }
function hydrateWorldCache(data: MineMotionPackageData): MineMotionProject {
  const project = data.project; const world = project.world; const cachePath = world?.cachedMesh?.cacheAssetPath;
  if (!world || !cachePath || (world.importedChunks?.length ?? 0) > 0) return project;
  const cacheRaw = data.assets.worldCaches?.[cachePath];
  if (!cacheRaw) return { ...project, world: { ...world, notes: [...new Set([...world.notes, `Portable world cache is missing: ${cachePath}.`])].slice(-100) } };
  try {
    const cache = parsePortableWorldChunkCache(cacheRaw); const importedChunks = decodePortableWorldChunkCache(cache);
    return { ...project, world: { ...world, importedChunks, cachedMesh: { ...world.cachedMesh, embedded: true, generatedAt: cache.generatedAt, formatVersion: cache.formatVersion, fingerprint: cache.fingerprint, chunkCount: importedChunks.length, blockCount: importedChunks.reduce((sum, chunk) => sum + chunk.blocks.length, 0) } } };
  } catch (error) { const message = error instanceof Error ? error.message : "Unknown cache error."; return { ...project, world: { ...world, notes: [...new Set([...world.notes, `Portable world cache could not be restored: ${message}`])].slice(-100) } }; }
}
