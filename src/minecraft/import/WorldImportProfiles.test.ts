import { describe, expect, it } from "vitest";
import { DEFAULT_WORLD_IMPORT_OPTIONS } from "./WorldImportManager";
import {
  applyWorldImportProfile,
  createWorldImportProfile,
  removeWorldImportProfile,
  sanitizeWorldImportProfiles,
  saveWorldImportProfile
} from "./WorldImportProfiles";

describe("WorldImportProfiles", () => {
  it("saves and reapplies bounded import selections", () => {
    const profile = createWorldImportProfile("Castle close-up", {
      ...DEFAULT_WORLD_IMPORT_OPTIONS,
      centerChunkX: -42,
      centerChunkZ: 17,
      radiusChunks: 3,
      maxChunks: 48
    }, "2026-07-29T00:00:00.000Z", "profile_castle");
    const stored = saveWorldImportProfile([], profile);

    expect(applyWorldImportProfile(stored[0], DEFAULT_WORLD_IMPORT_OPTIONS)).toMatchObject({
      centerChunkX: -42,
      centerChunkZ: 17,
      radiusChunks: 3,
      maxChunks: 48
    });
    expect(removeWorldImportProfile(stored, "profile_castle")).toEqual([]);
  });

  it("sanitizes hostile legacy profile values", () => {
    const [profile] = sanitizeWorldImportProfiles([{
      id: "legacy",
      name: "",
      dimension: "overworld",
      centerChunkX: Number.NaN,
      centerChunkZ: Number.POSITIVE_INFINITY,
      radiusChunks: 99_999,
      maxChunks: -1,
      maxRegionFiles: 999,
      maxVerticalSections: 999
    }]);

    expect(profile).toMatchObject({
      centerChunkX: 0,
      centerChunkZ: 0,
      radiusChunks: 64,
      maxChunks: 1,
      maxRegionFiles: 128,
      maxVerticalSections: 64
    });
  });
});
