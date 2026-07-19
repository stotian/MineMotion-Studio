import type { BuiltinVfxPreset, BuiltinVfxPresetCategory } from "./BuiltinVfxPresetTypes";

export const VFX_LIBRARY_PREFERENCES_VERSION = 1 as const;
export const VFX_LIBRARY_PREFERENCES_STORAGE_KEY = "minemotion.vfx-library.preferences.v1";
export const MAX_VFX_LIBRARY_FAVORITES = 128;
export const MAX_VFX_LIBRARY_RECENTS = 20;

export type VfxLibrarySourceFilter = "all" | "builtin" | "custom";

export interface VfxLibraryFilterState {
  search: string;
  category: "all" | BuiltinVfxPresetCategory;
  selectedTags: readonly string[];
  source: VfxLibrarySourceFilter;
  favoritesOnly: boolean;
}

export interface VfxLibraryPreferences {
  version: typeof VFX_LIBRARY_PREFERENCES_VERSION;
  favoriteIds: readonly string[];
  recentIds: readonly string[];
}

export const DEFAULT_VFX_LIBRARY_FILTERS: VfxLibraryFilterState = Object.freeze({
  search: "",
  category: "all",
  selectedTags: Object.freeze([]),
  source: "all",
  favoritesOnly: false
});

export const DEFAULT_VFX_LIBRARY_PREFERENCES: VfxLibraryPreferences = Object.freeze({
  version: VFX_LIBRARY_PREFERENCES_VERSION,
  favoriteIds: Object.freeze([]),
  recentIds: Object.freeze([])
});

const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

function sanitizeIds(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const candidate of value) {
    if (
      typeof candidate !== "string" ||
      !ID_PATTERN.test(candidate) ||
      seen.has(candidate)
    ) continue;
    seen.add(candidate);
    ids.push(candidate);
    if (ids.length === limit) break;
  }
  return ids;
}

export function parseVfxLibraryPreferences(value: unknown): VfxLibraryPreferences {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return DEFAULT_VFX_LIBRARY_PREFERENCES;
  }
  const record = value as Record<string, unknown>;
  if (record.version !== VFX_LIBRARY_PREFERENCES_VERSION) {
    return DEFAULT_VFX_LIBRARY_PREFERENCES;
  }
  return {
    version: VFX_LIBRARY_PREFERENCES_VERSION,
    favoriteIds: sanitizeIds(record.favoriteIds, MAX_VFX_LIBRARY_FAVORITES),
    recentIds: sanitizeIds(record.recentIds, MAX_VFX_LIBRARY_RECENTS)
  };
}

export function loadVfxLibraryPreferences(
  storage: Pick<Storage, "getItem">
): VfxLibraryPreferences {
  try {
    const raw = storage.getItem(VFX_LIBRARY_PREFERENCES_STORAGE_KEY);
    return raw === null
      ? DEFAULT_VFX_LIBRARY_PREFERENCES
      : parseVfxLibraryPreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_VFX_LIBRARY_PREFERENCES;
  }
}

export function saveVfxLibraryPreferences(
  storage: Pick<Storage, "setItem">,
  preferences: VfxLibraryPreferences
): boolean {
  try {
    storage.setItem(
      VFX_LIBRARY_PREFERENCES_STORAGE_KEY,
      JSON.stringify(parseVfxLibraryPreferences(preferences))
    );
    return true;
  } catch {
    return false;
  }
}

export function toggleVfxLibraryFavorite(
  preferences: VfxLibraryPreferences,
  presetId: string
): VfxLibraryPreferences {
  if (!ID_PATTERN.test(presetId)) return parseVfxLibraryPreferences(preferences);
  const favoriteIds = preferences.favoriteIds.includes(presetId)
    ? preferences.favoriteIds.filter((id) => id !== presetId)
    : [presetId, ...preferences.favoriteIds].slice(0, MAX_VFX_LIBRARY_FAVORITES);
  return { ...parseVfxLibraryPreferences(preferences), favoriteIds };
}

export function recordRecentVfxPreset(
  preferences: VfxLibraryPreferences,
  presetId: string
): VfxLibraryPreferences {
  if (!ID_PATTERN.test(presetId)) return parseVfxLibraryPreferences(preferences);
  return {
    ...parseVfxLibraryPreferences(preferences),
    recentIds: [
      presetId,
      ...preferences.recentIds.filter((id) => id !== presetId)
    ].slice(0, MAX_VFX_LIBRARY_RECENTS)
  };
}

export function listVfxLibraryTags(
  presets: readonly BuiltinVfxPreset[]
): readonly string[] {
  return [...new Set(presets.flatMap((preset) => preset.metadata.tags))].sort(compareText);
}

export function filterBuiltinVfxPresets(
  presets: readonly BuiltinVfxPreset[],
  filters: VfxLibraryFilterState,
  favoriteIds: readonly string[]
): readonly BuiltinVfxPreset[] {
  if (filters.source === "custom") return [];
  const search = normalizeSearch(filters.search);
  const favorites = new Set(favoriteIds);
  const selectedTags = new Set(filters.selectedTags);
  return presets.filter((preset) => {
    if (filters.category !== "all" && preset.metadata.category !== filters.category) {
      return false;
    }
    if (filters.favoritesOnly && !favorites.has(preset.metadata.id)) return false;
    if (
      selectedTags.size > 0 &&
      ![...selectedTags].every((tag) => preset.metadata.tags.includes(tag))
    ) return false;
    if (search === "") return true;
    const searchable = normalizeSearch([
      preset.localizedName,
      preset.definition.description,
      preset.metadata.category,
      preset.definition.space,
      preset.metadata.compatibility.maturity,
      preset.metadata.compatibility.runtime,
      ...preset.metadata.tags
    ].join(" "));
    return searchable.includes(search);
  });
}

export function resolveRecentBuiltinVfxPresets(
  presets: readonly BuiltinVfxPreset[],
  recentIds: readonly string[]
): readonly BuiltinVfxPreset[] {
  const byId = new Map(presets.map((preset) => [preset.metadata.id, preset]));
  return recentIds.flatMap((id) => {
    const preset = byId.get(id);
    return preset ? [preset] : [];
  });
}
