import { builtinVfxPresetCatalog } from "../library/BuiltinVfxPresetCatalog";
import { readVfxPackageArchive } from "./VfxPackageArchiveReader";
import {
  compareVfxPackageVersions,
  inspectVfxPackage,
  satisfiesVfxPackageVersion,
  type VfxPackageInspectionReport
} from "./VfxPackageInspection";
import type { VfxPackageArchive } from "./VfxPackageTypes";

export const VFX_PACKAGE_REGISTRY_VERSION = 1 as const;
export const VFX_PACKAGE_REGISTRY_STORAGE_KEY = "minemotion.vfx-packages.v1";
export const VFX_PACKAGE_REGISTRY_LIMITS = Object.freeze({
  packages: 32,
  packageBytes: 1024 * 1024,
  totalBytes: 2 * 1024 * 1024,
  storageCharacters: 3 * 1024 * 1024
});

export interface InstalledVfxPackage {
  id: string;
  version: string;
  enabled: boolean;
  installedAt: string;
  updatedAt: string;
  archiveBase64: string;
  archiveByteLength: number;
  archive: VfxPackageArchive;
}

export interface VfxPackageRegistry {
  version: typeof VFX_PACKAGE_REGISTRY_VERSION;
  packages: readonly InstalledVfxPackage[];
}

export interface VfxPackageRegistryLoadResult {
  registry: VfxPackageRegistry;
  warnings: readonly string[];
}

interface StoredRegistryEntry {
  id: string;
  version: string;
  enabled: boolean;
  installedAt: string;
  updatedAt: string;
  archiveBase64: string;
}

interface StoredRegistry {
  version: typeof VFX_PACKAGE_REGISTRY_VERSION;
  packages: StoredRegistryEntry[];
}

const BUILTIN_IDS = new Set(
  builtinVfxPresetCatalog.list().flatMap((preset) => [
    preset.metadata.id,
    preset.metadata.definitionId,
    preset.metadata.effectType
  ])
);

export class VfxPackageRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VfxPackageRegistryError";
  }
}

function assertTimestamp(value: string, label: string): void {
  if (typeof value !== "string" || value.length > 64 || !Number.isFinite(Date.parse(value))) {
    throw new VfxPackageRegistryError(`${label} timestamp is invalid.`);
  }
}

function encodeBase64(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0;
    const b = bytes[index + 1] ?? 0;
    const c = bytes[index + 2] ?? 0;
    const value = (a << 16) | (b << 8) | c;
    output += alphabet[(value >> 18) & 63];
    output += alphabet[(value >> 12) & 63];
    output += index + 1 < bytes.length ? alphabet[(value >> 6) & 63] : "=";
    output += index + 2 < bytes.length ? alphabet[value & 63] : "=";
  }
  return output;
}

function decodeBase64(value: unknown): Uint8Array {
  if (typeof value !== "string" || value.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new VfxPackageRegistryError("Stored package archive is not valid base64.");
  }
  const lookup = new Map([..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"].map((character, index) => [character, index]));
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  const output = new Uint8Array(value.length / 4 * 3 - padding);
  let target = 0;
  for (let index = 0; index < value.length; index += 4) {
    const block = ((lookup.get(value[index]) ?? 0) << 18) | ((lookup.get(value[index + 1]) ?? 0) << 12) | ((lookup.get(value[index + 2]) ?? 0) << 6) | (lookup.get(value[index + 3]) ?? 0);
    if (target < output.length) output[target++] = (block >> 16) & 0xff;
    if (target < output.length) output[target++] = (block >> 8) & 0xff;
    if (target < output.length) output[target++] = block & 0xff;
  }
  return output;
}

function cloneBytes(buffer: ArrayBuffer | Uint8Array): Uint8Array {
  return buffer instanceof Uint8Array ? buffer.slice() : new Uint8Array(buffer.slice(0));
}

function freezeEntry(entry: InstalledVfxPackage): InstalledVfxPackage {
  return Object.freeze({ ...entry });
}

function createRegistry(entries: readonly InstalledVfxPackage[]): VfxPackageRegistry {
  if (entries.length > VFX_PACKAGE_REGISTRY_LIMITS.packages) throw new VfxPackageRegistryError("Local VFX package registry is full.");
  const ids = new Set<string>();
  let totalBytes = 0;
  const frozen = entries.map((entry) => {
    if (ids.has(entry.id)) throw new VfxPackageRegistryError(`Duplicate installed package ID: ${entry.id}.`);
    if (BUILTIN_IDS.has(entry.id)) throw new VfxPackageRegistryError(`Package ID is reserved by an immutable built-in: ${entry.id}.`);
    ids.add(entry.id);
    if (entry.archiveByteLength > VFX_PACKAGE_REGISTRY_LIMITS.packageBytes) throw new VfxPackageRegistryError(`Package ${entry.id} exceeds the 1 MB local install limit.`);
    totalBytes += entry.archiveByteLength;
    return freezeEntry(entry);
  });
  if (totalBytes > VFX_PACKAGE_REGISTRY_LIMITS.totalBytes) throw new VfxPackageRegistryError("Installed VFX packages exceed the 2 MB local registry limit.");
  return Object.freeze({ version: VFX_PACKAGE_REGISTRY_VERSION, packages: Object.freeze(frozen) });
}

function enabledVersions(registry: VfxPackageRegistry, excludeId?: string) {
  return registry.packages
    .filter((entry) => entry.enabled && entry.id !== excludeId)
    .map((entry) => ({ id: entry.id, version: entry.version }));
}

function assertNoBrokenDependents(
  registry: VfxPackageRegistry,
  targetId: string,
  replacementVersion: string | null
): void {
  for (const dependent of registry.packages) {
    if (!dependent.enabled || dependent.id === targetId) continue;
    const dependency = dependent.archive.manifest.dependencies.find((item) => item.id === targetId && !item.optional);
    if (dependency && (replacementVersion === null || !satisfiesVfxPackageVersion(replacementVersion, dependency.versionRange))) {
      throw new VfxPackageRegistryError(`${dependent.id} requires ${targetId} ${dependency.versionRange}.`);
    }
  }
}

async function entryFromBytes(
  bytes: ArrayBuffer | Uint8Array,
  enabled: boolean,
  installedAt: string,
  updatedAt: string
): Promise<InstalledVfxPackage> {
  assertTimestamp(installedAt, "Installed");
  assertTimestamp(updatedAt, "Updated");
  const archiveBytes = cloneBytes(bytes);
  if (archiveBytes.byteLength > VFX_PACKAGE_REGISTRY_LIMITS.packageBytes) throw new VfxPackageRegistryError("Package exceeds the 1 MB local install limit.");
  const archive = await readVfxPackageArchive(archiveBytes.buffer as ArrayBuffer);
  if (BUILTIN_IDS.has(archive.manifest.id)) throw new VfxPackageRegistryError(`Package ID is reserved by an immutable built-in: ${archive.manifest.id}.`);
  return freezeEntry({
    id: archive.manifest.id,
    version: archive.manifest.packageVersion,
    enabled,
    installedAt,
    updatedAt,
    archiveBase64: encodeBase64(archiveBytes),
    archiveByteLength: archiveBytes.byteLength,
    archive
  });
}

export function createEmptyVfxPackageRegistry(): VfxPackageRegistry {
  return createRegistry([]);
}

export async function installVfxPackage(
  registry: VfxPackageRegistry,
  bytes: ArrayBuffer | Uint8Array,
  timestamp: string
): Promise<VfxPackageRegistry> {
  const entry = await entryFromBytes(bytes, true, timestamp, timestamp);
  if (registry.packages.some((item) => item.id === entry.id)) throw new VfxPackageRegistryError(`Package ${entry.id} is already installed; use update.`);
  const report = inspectVfxPackage(entry.archive, enabledVersions(registry));
  if (!report.installReady) throw new VfxPackageRegistryError("Required VFX package dependencies are missing or incompatible.");
  return createRegistry([...registry.packages, entry].sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
}

export async function updateVfxPackage(
  registry: VfxPackageRegistry,
  bytes: ArrayBuffer | Uint8Array,
  timestamp: string
): Promise<VfxPackageRegistry> {
  const candidate = await entryFromBytes(bytes, true, timestamp, timestamp);
  const existing = registry.packages.find((entry) => entry.id === candidate.id);
  if (!existing) throw new VfxPackageRegistryError(`Package ${candidate.id} is not installed.`);
  if (compareVfxPackageVersions(candidate.version, existing.version) <= 0) throw new VfxPackageRegistryError("Package updates must increase semantic version.");
  const report = inspectVfxPackage(candidate.archive, enabledVersions(registry, existing.id));
  if (!report.installReady) throw new VfxPackageRegistryError("Updated package dependencies are missing or incompatible.");
  assertNoBrokenDependents(registry, existing.id, candidate.version);
  const replacement = freezeEntry({ ...candidate, enabled: existing.enabled, installedAt: existing.installedAt, updatedAt: timestamp });
  return createRegistry(registry.packages.map((entry) => entry.id === existing.id ? replacement : entry));
}

export function setVfxPackageEnabled(
  registry: VfxPackageRegistry,
  packageId: string,
  enabled: boolean
): VfxPackageRegistry {
  const entry = registry.packages.find((item) => item.id === packageId);
  if (!entry) throw new VfxPackageRegistryError(`Package ${packageId} is not installed.`);
  if (entry.enabled === enabled) return registry;
  if (enabled) {
    const report = inspectVfxPackage(entry.archive, enabledVersions(registry, entry.id));
    if (!report.installReady) throw new VfxPackageRegistryError("Required VFX package dependencies are missing or incompatible.");
  } else {
    assertNoBrokenDependents(registry, packageId, null);
  }
  return createRegistry(registry.packages.map((item) => item.id === packageId ? freezeEntry({ ...item, enabled }) : item));
}

export function uninstallVfxPackage(
  registry: VfxPackageRegistry,
  packageId: string
): VfxPackageRegistry {
  if (!registry.packages.some((entry) => entry.id === packageId)) throw new VfxPackageRegistryError(`Package ${packageId} is not installed.`);
  assertNoBrokenDependents(registry, packageId, null);
  return createRegistry(registry.packages.filter((entry) => entry.id !== packageId));
}

export function inspectInstalledVfxPackage(
  registry: VfxPackageRegistry,
  packageId: string,
  requestedLocale?: string
): VfxPackageInspectionReport {
  const entry = registry.packages.find((item) => item.id === packageId);
  if (!entry) throw new VfxPackageRegistryError(`Package ${packageId} is not installed.`);
  return inspectVfxPackage(entry.archive, enabledVersions(registry, entry.id), requestedLocale);
}

export function saveVfxPackageRegistry(
  storage: Pick<Storage, "setItem">,
  registry: VfxPackageRegistry
): boolean {
  const payload: StoredRegistry = {
    version: VFX_PACKAGE_REGISTRY_VERSION,
    packages: registry.packages.map((entry) => ({
      id: entry.id,
      version: entry.version,
      enabled: entry.enabled,
      installedAt: entry.installedAt,
      updatedAt: entry.updatedAt,
      archiveBase64: entry.archiveBase64
    }))
  };
  const raw = JSON.stringify(payload);
  if (raw.length > VFX_PACKAGE_REGISTRY_LIMITS.storageCharacters) return false;
  try {
    storage.setItem(VFX_PACKAGE_REGISTRY_STORAGE_KEY, raw);
    return true;
  } catch {
    return false;
  }
}

export async function loadVfxPackageRegistry(
  storage: Pick<Storage, "getItem">
): Promise<VfxPackageRegistryLoadResult> {
  let raw: string | null;
  try {
    raw = storage.getItem(VFX_PACKAGE_REGISTRY_STORAGE_KEY);
  } catch {
    return { registry: createEmptyVfxPackageRegistry(), warnings: ["Local VFX package storage is unavailable."] };
  }
  if (raw === null) return { registry: createEmptyVfxPackageRegistry(), warnings: [] };
  if (raw.length > VFX_PACKAGE_REGISTRY_LIMITS.storageCharacters) return { registry: createEmptyVfxPackageRegistry(), warnings: ["Stored VFX package registry exceeds its safe size and was ignored."] };
  try {
    const parsed = JSON.parse(raw) as Partial<StoredRegistry>;
    if (parsed.version !== VFX_PACKAGE_REGISTRY_VERSION || !Array.isArray(parsed.packages) || parsed.packages.length > VFX_PACKAGE_REGISTRY_LIMITS.packages) throw new VfxPackageRegistryError("Stored VFX package registry version or count is invalid.");
    const entries: InstalledVfxPackage[] = [];
    for (const stored of parsed.packages) {
      if (typeof stored !== "object" || stored === null || Object.keys(stored).some((key) => !["id", "version", "enabled", "installedAt", "updatedAt", "archiveBase64"].includes(key)) || typeof stored.id !== "string" || typeof stored.version !== "string" || typeof stored.enabled !== "boolean") throw new VfxPackageRegistryError("Stored VFX package entry is invalid.");
      const entry = await entryFromBytes(decodeBase64(stored.archiveBase64), stored.enabled, stored.installedAt, stored.updatedAt);
      if (entry.id !== stored.id || entry.version !== stored.version) throw new VfxPackageRegistryError("Stored VFX package metadata does not match its archive.");
      entries.push(entry);
    }
    const registry = createRegistry(entries);
    for (const entry of registry.packages) {
      if (entry.enabled && !inspectVfxPackage(entry.archive, enabledVersions(registry, entry.id)).installReady) {
        throw new VfxPackageRegistryError(`Stored enabled package ${entry.id} has missing or incompatible dependencies.`);
      }
    }
    return { registry, warnings: [] };
  } catch (error) {
    return {
      registry: createEmptyVfxPackageRegistry(),
      warnings: [error instanceof Error ? `Stored VFX package registry was ignored: ${error.message}` : "Stored VFX package registry was ignored."]
    };
  }
}
