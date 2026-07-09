import { describe, expect, it } from "vitest";
import { sanitizeEffects } from "./EffectSerializer";

describe("EffectSerializer", () => {
  it("fills missing effect fields", () => {
    const [effect] = sanitizeEffects([
      {
        id: "effect_1",
        type: "lightningStrike",
        startFrame: 24
      }
    ]);

    expect(effect.id).toBe("effect_1");
    expect(effect.durationFrames).toBeGreaterThan(0);
    expect(effect.position).toEqual([0, 2, 0]);
    expect(effect.enabled).toBe(true);
  });
});
