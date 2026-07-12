import { describe, expect, it } from "vitest";
import { createEffectInstance, effectRegistry } from "./EffectRegistry";
import { getEffectProgress, isEffectActive } from "./EffectTypes";

describe("EffectRegistry", () => {
  it("exposes built-in cinematic effects", () => {
    const effects = effectRegistry.list();

    expect(effects.length).toBeGreaterThanOrEqual(10);
    expect(effects.map((effect) => effect.type)).toContain("lightningStrike");
    expect(effects.map((effect) => effect.type)).toContain("cameraShake");
  });

  it("creates active effect instances with defaults", () => {
    const effect = createEffectInstance("flash", {
      id: "effect_test",
      startFrame: 12
    });

    expect(effect.enabled).toBe(true);
    expect(effect.durationFrames).toBeGreaterThan(1);
    expect(isEffectActive(effect, 12)).toBe(true);
    expect(getEffectProgress(effect, 12)).toBe(0);
  });

  it("keeps the legacy terminal frame inclusive", () => {
    const effect = createEffectInstance("flash", {
      id: "effect_timing",
      startFrame: 12
    });
    const endFrame = effect.startFrame + effect.durationFrames;

    expect(isEffectActive(effect, endFrame)).toBe(true);
    expect(getEffectProgress(effect, endFrame)).toBe(1);
    expect(isEffectActive(effect, endFrame + 1)).toBe(false);
  });
});
