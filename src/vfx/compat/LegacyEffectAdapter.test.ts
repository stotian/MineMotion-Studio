import { describe, expect, it } from "vitest";
import { BUILTIN_EFFECTS } from "../../effects/EffectRegistry";
import type { EffectInstance } from "../../effects/EffectTypes";
import { isVfxActive } from "../core/VfxInstance";
import {
  adaptLegacyEffectDefinition,
  adaptLegacyEffectInstance,
  adaptVfxInstanceToLegacyEffect,
  createLegacyVfxRegistry,
  createLegacyVfxSeed
} from "./LegacyEffectAdapter";

function createMaximalLegacyEffect(): EffectInstance {
  return {
    id: "effect_legacy_all",
    type: "lightningStrike",
    name: "Legacy Lightning",
    startFrame: 24,
    durationFrames: 10,
    position: [1.25, 4.5, -2],
    targetObjectId: "character_steve",
    parameters: {
      color: "#b9e7ff",
      secondaryColor: "#ffffff",
      intensity: 1.2,
      alpha: 0.9,
      radius: 2.5,
      size: 0.16,
      count: 18,
      frequency: 18,
      strength: 0.8,
      decay: 0.8,
      direction: "radial",
      barStyle: "2.35:1",
      contrast: 1.8,
      saturation: 1.1,
      speed: 1,
      flash: true
    },
    enabled: false
  };
}

describe("LegacyEffectAdapter", () => {
  it("round-trips every legacy instance field and parameter", () => {
    const legacy = createMaximalLegacyEffect();
    const adapted = adaptLegacyEffectInstance(legacy);
    const result = adaptVfxInstanceToLegacyEffect(adapted);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(legacy);
    expect(result.warnings.map((item) => item.code)).toContain(
      "VFX_PARAMETER_UNKNOWN"
    );
  });

  it("preserves special own legacy parameter keys in both directions", () => {
    const legacy = {
      ...createMaximalLegacyEffect(),
      parameters: Object.fromEntries([
        ...Object.entries(createMaximalLegacyEffect().parameters),
        ["__proto__", "preserved"]
      ])
    } as EffectInstance;
    const adapted = adaptLegacyEffectInstance(legacy);
    const result = adaptVfxInstanceToLegacyEffect(adapted);

    expect(Object.hasOwn(adapted.parameters, "__proto__")).toBe(true);
    expect(adapted.parameters.__proto__).toBe("preserved");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.hasOwn(result.value.parameters, "__proto__")).toBe(true);
    expect(
      (result.value.parameters as Record<string, unknown>).__proto__
    ).toBe("preserved");
  });

  it("adapts all built-in definitions from the authoritative registry data", () => {
    const adapted = BUILTIN_EFFECTS.map(adaptLegacyEffectDefinition);

    expect(
      adapted.map((definition) => ({
        id: definition.id,
        space: definition.space,
        duration: definition.defaultDurationFrames,
        defaults: Object.fromEntries(
          definition.parameterSchema.map((parameter) => [
            parameter.id,
            parameter.defaultValue
          ])
        ),
        tags: definition.tags
      }))
    ).toEqual(
      BUILTIN_EFFECTS.map((definition) => ({
        id: definition.type,
        space: definition.space,
        duration: definition.defaultDurationFrames,
        defaults: definition.defaultParameters,
        tags: definition.tags
      }))
    );
    expect(createLegacyVfxRegistry().list()).toHaveLength(BUILTIN_EFFECTS.length);
  });

  it("preserves blank and populated target IDs", () => {
    const blank = adaptLegacyEffectInstance({
      ...createMaximalLegacyEffect(),
      targetObjectId: ""
    });
    const populated = adaptLegacyEffectInstance(createMaximalLegacyEffect());

    expect(blank.target).toBeNull();
    expect(populated.target).toEqual({ entityId: "character_steve" });
  });

  it("clones source tuples and parameter maps", () => {
    const legacy = createMaximalLegacyEffect();
    const adapted = adaptLegacyEffectInstance(legacy);
    adapted.transform.position[0] = 999;
    (adapted.parameters as Record<string, string | number | boolean>).alpha = 0;

    expect(legacy.position[0]).toBe(1.25);
    expect(legacy.parameters.alpha).toBe(0.9);
  });

  it("creates stable compatibility seeds without random entropy", () => {
    const first = adaptLegacyEffectInstance(createMaximalLegacyEffect());
    const second = adaptLegacyEffectInstance(createMaximalLegacyEffect());
    const other = adaptLegacyEffectInstance({
      ...createMaximalLegacyEffect(),
      id: "effect_other"
    });

    expect(first.seed).toBe(second.seed);
    expect(first.seed).toBe(
      createLegacyVfxSeed("effect_legacy_all", "lightningStrike")
    );
    expect(other.seed).not.toBe(first.seed);
  });

  it("preserves the inclusive legacy end-frame contract", () => {
    const adapted = adaptLegacyEffectInstance({
      ...createMaximalLegacyEffect(),
      enabled: true
    });

    expect(isVfxActive(adapted, 34)).toBe(true);
    expect(isVfxActive(adapted, 35)).toBe(false);
  });

  it.each([
    [
      "rotation",
      (instance: ReturnType<typeof adaptLegacyEffectInstance>) => ({
        ...instance,
        transform: {
          ...instance.transform,
          rotation: [1, 0, 0] as [number, number, number]
        }
      }),
      "VFX_LEGACY_ROTATION_UNSUPPORTED"
    ],
    [
      "scale",
      (instance: ReturnType<typeof adaptLegacyEffectInstance>) => ({
        ...instance,
        transform: {
          ...instance.transform,
          scale: [2, 2, 2] as [number, number, number]
        }
      }),
      "VFX_LEGACY_SCALE_UNSUPPORTED"
    ],
    [
      "bone target",
      (instance: ReturnType<typeof adaptLegacyEffectInstance>) => ({
        ...instance,
        target: { entityId: "character_steve", boneId: "head" }
      }),
      "VFX_LEGACY_BONE_TARGET_UNSUPPORTED"
    ],
    [
      "seed",
      (instance: ReturnType<typeof adaptLegacyEffectInstance>) => ({
        ...instance,
        seed: "custom-seed"
      }),
      "VFX_LEGACY_SEED_UNSUPPORTED"
    ],
    [
      "quality",
      (instance: ReturnType<typeof adaptLegacyEffectInstance>) => ({
        ...instance,
        previewQuality: "high" as const
      }),
      "VFX_LEGACY_QUALITY_UNSUPPORTED"
    ],
    [
      "blend mode",
      (instance: ReturnType<typeof adaptLegacyEffectInstance>) => ({
        ...instance,
        blendMode: "multiply" as const
      }),
      "VFX_LEGACY_BLEND_MODE_UNSUPPORTED"
    ],
    [
      "render layer",
      (instance: ReturnType<typeof adaptLegacyEffectInstance>) => ({
        ...instance,
        renderLayer: "post" as const
      }),
      "VFX_LEGACY_RENDER_LAYER_UNSUPPORTED"
    ],
    [
      "parameter keyframes",
      (instance: ReturnType<typeof adaptLegacyEffectInstance>) => ({
        ...instance,
        parameterKeyframes: [
          {
            id: "keyframe_radius_1",
            parameterId: "radius",
            localFrame: 5,
            value: 4,
            interpolation: "linear" as const
          }
        ]
      }),
      "VFX_LEGACY_PARAMETER_KEYFRAMES_UNSUPPORTED"
    ]
  ])("rejects lossy schema 9 conversion for %s", (_label, mutate, code) => {
    const instance = mutate(
      adaptLegacyEffectInstance(createMaximalLegacyEffect())
    );
    const result = adaptVfxInstanceToLegacyEffect(instance);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((item) => item.code)).toContain(code);
  });

  it("remains structured-cloneable for project history", () => {
    const adapted = adaptLegacyEffectInstance(createMaximalLegacyEffect());

    expect(structuredClone(adapted)).toEqual(adapted);
  });

  it("rejects definitions that schema 9 cannot represent", () => {
    const adapted = {
      ...adaptLegacyEffectInstance(createMaximalLegacyEffect()),
      definitionId: "custom.future.effect"
    };
    const result = adaptVfxInstanceToLegacyEffect(adapted);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((item) => item.code)).toContain(
      "VFX_LEGACY_DEFINITION_UNSUPPORTED"
    );
  });
});
