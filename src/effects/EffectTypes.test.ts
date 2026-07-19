import { describe, expect, it } from "vitest";
import { BUILTIN_EFFECTS } from "./EffectRegistry";
import {
  getBoundedLegacyParticleCount,
  MAX_LEGACY_EFFECT_PARTICLE_COUNT,
  MAX_LEGACY_PARTICLES_PER_FRAME
} from "./EffectTypes";
import { adaptLegacyEffectDefinition } from "../vfx/compat/LegacyEffectAdapter";

describe("legacy effect runtime budgets", () => {
  const glowBurst = (count: number) => ({
    type: "glowBurst" as const,
    parameters: { count }
  });

  it("caps each burst and obeys the remaining global frame budget", () => {
    expect(getBoundedLegacyParticleCount(glowBurst(18))).toBe(18);
    expect(getBoundedLegacyParticleCount(glowBurst(0))).toBe(0);
    expect(getBoundedLegacyParticleCount(glowBurst(3))).toBe(3);
    expect(getBoundedLegacyParticleCount(glowBurst(1e9))).toBe(
      MAX_LEGACY_EFFECT_PARTICLE_COUNT
    );
    expect(getBoundedLegacyParticleCount(glowBurst(100), 12)).toBe(12);
    expect(getBoundedLegacyParticleCount(glowBurst(100), 0)).toBe(0);
    expect(MAX_LEGACY_PARTICLES_PER_FRAME).toBeGreaterThanOrEqual(
      MAX_LEGACY_EFFECT_PARTICLE_COUNT
    );
  });

  it("shares the exact per-burst cap with the adapted VFX definition", () => {
    const definition = adaptLegacyEffectDefinition(
      BUILTIN_EFFECTS.find((effect) => effect.type === "glowBurst")!
    );
    const count = definition.parameterSchema.find(
      (parameter) => parameter.id === "count"
    );

    expect(count?.kind).toBe("integer");
    if (count?.kind === "integer") {
      expect(count.max).toBe(MAX_LEGACY_EFFECT_PARTICLE_COUNT);
    }
  });
});
