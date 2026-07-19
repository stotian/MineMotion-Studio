import { describe, expect, it } from "vitest";
import { builtinVfxPresetCatalog } from "./BuiltinVfxPresetCatalog";
import {
  DEFAULT_VFX_LIBRARY_FILTERS,
  MAX_VFX_LIBRARY_FAVORITES,
  MAX_VFX_LIBRARY_RECENTS,
  VFX_LIBRARY_PREFERENCES_STORAGE_KEY,
  filterBuiltinVfxPresets,
  listVfxLibraryTags,
  loadVfxLibraryPreferences,
  parseVfxLibraryPreferences,
  recordRecentVfxPreset,
  resolveRecentBuiltinVfxPresets,
  saveVfxLibraryPreferences,
  toggleVfxLibraryFavorite
} from "./VfxLibraryNavigation";

describe("VfxLibraryNavigation", () => {
  const presets = builtinVfxPresetCatalog.list();

  it("combines search, category, tags, favorites, and source filters", () => {
    const result = filterBuiltinVfxPresets(
      presets,
      {
        ...DEFAULT_VFX_LIBRARY_FILTERS,
        search: "elytra minecraft",
        category: "movement-trails",
        selectedTags: ["movement"],
        favoritesOnly: true
      },
      ["movementElytraTrail"]
    );
    expect(result.map((preset) => preset.metadata.id)).toEqual(["movementElytraTrail"]);
    expect(filterBuiltinVfxPresets(presets, { ...DEFAULT_VFX_LIBRARY_FILTERS, source: "custom" }, [])).toEqual([]);
  });

  it("lists stable sorted unique tags", () => {
    const tags = listVfxLibraryTags(presets);
    expect(tags).toEqual([...new Set(tags)].sort());
    expect(tags).toEqual(expect.arrayContaining(["combat", "minecraft", "screen"]));
  });

  it("bounds and deduplicates favorites and recents", () => {
    let preferences = parseVfxLibraryPreferences({ version: 1, favoriteIds: [], recentIds: [] });
    for (let index = 0; index < 150; index += 1) {
      preferences = toggleVfxLibraryFavorite(preferences, `preset_${index}`);
      preferences = recordRecentVfxPreset(preferences, `preset_${index}`);
    }
    preferences = recordRecentVfxPreset(preferences, "preset_149");
    expect(preferences.favoriteIds).toHaveLength(MAX_VFX_LIBRARY_FAVORITES);
    expect(preferences.recentIds).toHaveLength(MAX_VFX_LIBRARY_RECENTS);
    expect(preferences.recentIds[0]).toBe("preset_149");
    expect(new Set(preferences.recentIds).size).toBe(preferences.recentIds.length);
  });

  it("loads and saves defensively without leaking malformed state", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); }
    };
    expect(saveVfxLibraryPreferences(storage, {
      version: 1,
      favoriteIds: ["magicAura", "magicAura", "bad id"],
      recentIds: ["movementDash"]
    })).toBe(true);
    expect(values.has(VFX_LIBRARY_PREFERENCES_STORAGE_KEY)).toBe(true);
    expect(loadVfxLibraryPreferences(storage)).toEqual({
      version: 1,
      favoriteIds: ["magicAura"],
      recentIds: ["movementDash"]
    });
    values.set(VFX_LIBRARY_PREFERENCES_STORAGE_KEY, "{broken");
    expect(loadVfxLibraryPreferences(storage).favoriteIds).toEqual([]);
  });

  it("resolves recents in personal order and drops missing IDs", () => {
    expect(
      resolveRecentBuiltinVfxPresets(presets, ["movementDash", "missing", "magicAura"])
        .map((preset) => preset.metadata.id)
    ).toEqual(["movementDash", "magicAura"]);
  });
});
