import { afterEach, describe, expect, it, vi } from "vitest";
import { sanitizeEffects } from "./EffectSerializer";
import { MAX_EFFECT_INSTANCES } from "./EffectTypes";

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it("generates deterministic fallback IDs without ambient entropy", () => {
    vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("random must not be used");
    });
    vi.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("clock must not be used");
    });

    const source = [{ type: "flash", startFrame: 4 }];
    expect(sanitizeEffects(source)[0].id).toBe("effect_legacy_1");
    expect(sanitizeEffects(source)).toEqual(sanitizeEffects(source));
  });

  it.each([
    [[null], /plain object/i],
    [[{ id: "same" }, { id: "same" }], /duplicate effect id/i],
    [[{ id: "bad id" }], /effect id is invalid/i],
    [[{ id: "effect_1", type: "unknown" }], /not registered/i],
    [[{ id: "effect_1", startFrame: Number.POSITIVE_INFINITY }], /finite number/i],
    [[{ id: "effect_1", position: new Array(3) }], /three finite numbers/i],
    [[{ id: "effect_1", parameters: new Date() }], /plain object/i],
    [[{ id: "effect_1", enabled: "false" }], /boolean/i]
  ])("rejects malformed project effects with a stable error", (source, message) => {
    expect(() => sanitizeEffects(source)).toThrow(message);
  });

  it("preserves finite legacy parameter values for schema 9 compatibility", () => {
    const [effect] = sanitizeEffects([
      {
        id: "effect_legacy_count",
        type: "glowBurst",
        parameters: { count: 1e9 }
      }
    ]);

    expect(effect.parameters.count).toBe(1e9);
  });

  it("preserves special own parameter keys without changing the prototype", () => {
    const parameters = Object.fromEntries([
      ["__proto__", "legacy-value"],
      ["constructor", "legacy-constructor"]
    ]);

    const [effect] = sanitizeEffects([
      {
        id: "effect_legacy_special_keys",
        type: "flash",
        parameters
      }
    ]);

    expect(Object.getPrototypeOf(effect.parameters)).toBe(Object.prototype);
    expect(Object.hasOwn(effect.parameters, "__proto__")).toBe(true);
    const preserved = effect.parameters as unknown as Record<string, unknown>;
    expect(preserved["__proto__"]).toBe("legacy-value");
    expect(preserved.constructor).toBe("legacy-constructor");
  });

  it("normalizes negative zero in JSON-visible numeric fields", () => {
    const [effect] = sanitizeEffects([
      {
        id: "effect_zero",
        startFrame: -0,
        position: [-0, 2, -0],
        parameters: { radius: -0 }
      }
    ]);

    expect(Object.is(effect.startFrame, -0)).toBe(false);
    expect(effect.position.every((value) => !Object.is(value, -0))).toBe(true);
    expect(Object.is(effect.parameters.radius, -0)).toBe(false);
  });

  it("rejects a sparse effects array deterministically", () => {
    expect(() => sanitizeEffects(new Array(1))).toThrow(/dense/i);
  });

  it("preserves oversized legacy arrays for schema 9 compatibility", () => {
    const effects = Array.from({ length: MAX_EFFECT_INSTANCES + 1 }, (_, index) => ({
      id: `effect_${index}`,
      type: "flash"
    }));

    expect(sanitizeEffects(effects)).toHaveLength(MAX_EFFECT_INSTANCES + 1);
  });
});
