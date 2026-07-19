import { describe, expect, it } from "vitest";
import {
  BUILTIN_VFX_PRESET_LOCALIZATION,
  BuiltinVfxPresetCatalog,
  builtinVfxPresetCatalog
} from "./BuiltinVfxPresetCatalog";
import type { BuiltinVfxPreset } from "./BuiltinVfxPresetTypes";
import { validateBuiltinVfxPresetCatalog } from "./BuiltinVfxPresetValidator";

function clonePreset(id = "lightningStrike"): BuiltinVfxPreset {
  const preset = builtinVfxPresetCatalog.get(id);
  if (!preset) throw new Error(`Missing preset fixture: ${id}`);
  return structuredClone(preset);
}

describe("BuiltinVfxPresetCatalog", () => {
  it("joins every existing effect to native metadata without claiming stability", () => {
    const presets = builtinVfxPresetCatalog.list();

    expect(presets).toHaveLength(12);
    expect(builtinVfxPresetCatalog.countStable()).toBe(0);
    expect(presets.every((preset) => preset.metadata.id === preset.definition.id)).toBe(true);
    expect(
      presets.every(
        (preset) =>
          preset.metadata.frameBudget.stackWork ===
          1 +
            preset.metadata.frameBudget.particles +
            preset.metadata.frameBudget.segments
      )
    ).toBe(true);
    expect(
      builtinVfxPresetCatalog.get("colorGradeKeyframe")?.metadata.compatibility
        .maturity
    ).toBe("experimental");
  });

  it("freezes catalog metadata and filters experimental entries honestly", () => {
    const preset = builtinVfxPresetCatalog.get("glowBurst");
    expect(preset).not.toBeNull();
    if (!preset) return;
    expect(Object.isFrozen(preset)).toBe(true);
    expect(Object.isFrozen(preset.metadata)).toBe(true);
    expect(Object.isFrozen(preset.metadata.compatibility.capabilities)).toBe(true);
    expect(
      builtinVfxPresetCatalog
        .list({ includeExperimental: false })
        .some((candidate) => candidate.metadata.id === "colorGradeKeyframe")
    ).toBe(false);
  });

  it("rejects duplicate IDs and definitions", () => {
    const preset = clonePreset();
    const result = validateBuiltinVfxPresetCatalog([preset, clonePreset()], {
      localization: BUILTIN_VFX_PRESET_LOCALIZATION
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "VFX_PRESET_ID_DUPLICATE",
        "VFX_PRESET_DEFINITION_DUPLICATE",
        "VFX_PRESET_LOCALIZATION_DUPLICATE"
      ])
    );
  });

  it("rejects missing localization, assets, excessive budgets, and false stable claims", () => {
    const preset = clonePreset();
    preset.metadata.localizationKey = "vfx.presets.missing.name";
    preset.metadata.thumbnail = { kind: "asset", assetId: "missing-thumbnail" };
    preset.metadata.frameBudget.particles = 4_097;
    preset.metadata.frameBudget.stackWork = 4_098;
    preset.metadata.compatibility.maturity = "stable";

    const result = validateBuiltinVfxPresetCatalog([preset], {
      localization: {},
      assetIds: new Set()
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "VFX_PRESET_LOCALIZATION_MISSING",
        "VFX_PRESET_THUMBNAIL_ASSET_MISSING",
        "VFX_PRESET_BUDGET_INVALID",
        "VFX_PRESET_STABLE_CLAIM_INVALID"
      ])
    );
  });

  it("constructs a catalog only from a fully valid definition join", () => {
    const source = clonePreset();
    const catalog = new BuiltinVfxPresetCatalog([source]);
    const stored = catalog.get("lightningStrike");
    expect(stored?.localizedName).toBe("Lightning Strike");
    expect(Object.isFrozen(stored?.definition)).toBe(true);
    source.definition.tags = ["mutated"];
    expect(stored?.definition.tags).not.toEqual(["mutated"]);
  });

  it("fails closed for accessors and malformed definition schemas", () => {
    const accessorPreset = clonePreset();
    Object.defineProperty(accessorPreset.metadata, "id", {
      enumerable: true,
      get: () => "accessor"
    });
    const malformed = clonePreset("shockwave");
    malformed.definition.parameterSchema = "invalid" as never;

    const result = validateBuiltinVfxPresetCatalog(
      [accessorPreset, malformed],
      { localization: BUILTIN_VFX_PRESET_LOCALIZATION }
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "VFX_PRESET_RECORD_INVALID",
        "VFX_PARAMETER_SCHEMA_INVALID"
      ])
    );
  });
});
