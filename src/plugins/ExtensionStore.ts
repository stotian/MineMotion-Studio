import type { PluginManifest } from "./PluginManifest";
import type { SafeContentPack } from "./ExtensionTypes";

const STORAGE_KEY = "minemotion.extensions.v1";
const MAX_STORED_BYTES = 5 * 1024 * 1024;

export interface StoredExtensionRecord {
  payload: PluginManifest | SafeContentPack;
  trusted: boolean;
  enabled: boolean;
}

export function loadStoredExtensions(storage: Pick<Storage, "getItem">): StoredExtensionRecord[] {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw || raw.length > MAX_STORED_BYTES) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.flatMap((record) => {
      if (!record || typeof record !== "object") return [];
      const source = record as Partial<StoredExtensionRecord>;
      if (!source.payload || typeof source.payload !== "object") return [];
      return [{ payload: source.payload, trusted: source.trusted === true, enabled: source.enabled === true }];
    }).slice(0, 100);
  } catch {
    return [];
  }
}

export function saveStoredExtensions(
  storage: Pick<Storage, "setItem">,
  records: StoredExtensionRecord[]
): void {
  const raw = JSON.stringify(records.slice(0, 100));
  if (raw.length > MAX_STORED_BYTES) throw new Error("Installed extension metadata exceeds the local storage limit.");
  storage.setItem(STORAGE_KEY, raw);
}
