import { describe, expect, it } from "vitest";
import { BUILTIN_EFFECTS } from "../../effects/EffectRegistry";
import { VFX_VARIANTS, listVfxVariantsByCategory } from "./VfxVariantLibrary";

describe("VFX variant library", () => {
  const effectTypes = new Set(BUILTIN_EFFECTS.map((effect) => effect.type));

  it("only names effect types that actually exist", () => {
    // A variant pointing at a renamed or removed effect would appear in the
    // library and then do nothing when clicked — a dead entry, which is worse
    // than not shipping it at all.
    const unknown = VFX_VARIANTS.filter(
      (entry) => !effectTypes.has(entry.effectType)
    ).map((entry) => `${entry.id} -> ${entry.effectType}`);

    expect(unknown).toEqual([]);
  });

  it("gives every variant a unique id, a name and a description", () => {
    const ids = new Set(VFX_VARIANTS.map((entry) => entry.id));
    expect(ids.size).toBe(VFX_VARIANTS.length);
    for (const entry of VFX_VARIANTS) {
      expect(entry.name.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it("only overrides parameters the effect actually declares", () => {
    // Overriding a parameter the effect does not read would silently do
    // nothing, so the variant would not differ from the base preset.
    const byType = new Map(BUILTIN_EFFECTS.map((effect) => [effect.type, effect]));
    const stray: string[] = [];
    for (const entry of VFX_VARIANTS) {
      const definition = byType.get(entry.effectType);
      if (!definition) continue;
      for (const key of Object.keys(entry.parameters)) {
        if (!(key in definition.defaultParameters)) {
          stray.push(`${entry.id}: ${entry.effectType} has no "${key}"`);
        }
      }
    }
    expect(stray).toEqual([]);
  });

  it("keeps durations positive when overridden", () => {
    for (const entry of VFX_VARIANTS) {
      if (entry.durationFrames === undefined) continue;
      expect(entry.durationFrames).toBeGreaterThan(0);
    }
  });

  it("covers every category it advertises", () => {
    const categories = new Set(VFX_VARIANTS.map((entry) => entry.category));
    for (const category of categories) {
      expect(listVfxVariantsByCategory(category).length).toBeGreaterThan(0);
    }
  });
});
