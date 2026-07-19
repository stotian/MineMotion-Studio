import { describe, expect, it } from "vitest";
import type { VfxDefinition } from "./VfxDefinition";
import type { VfxInstance } from "./VfxInstance";
import { MAX_VFX_PARAMETER_ID_LENGTH } from "./VfxParameter";
import { validateVfxDefinition, validateVfxInstance } from "./VfxValidator";

function createDefinition(): VfxDefinition {
  return {
    version: 1,
    id: "test.burst",
    displayName: "Test Burst",
    description: "Validator fixture.",
    space: "world",
    defaultDurationFrames: 20,
    defaultBlendMode: "additive",
    defaultRenderLayer: "world",
    parameterSchema: [
      {
        id: "count",
        displayName: "Count",
        animatable: true,
        kind: "integer",
        defaultValue: 8,
        min: 1,
        max: 64
      },
      {
        id: "direction",
        displayName: "Direction",
        animatable: false,
        kind: "enum",
        defaultValue: "radial",
        options: ["forward", "radial"]
      }
    ],
    tags: ["test"]
  };
}

function createInstance(): VfxInstance {
  return {
    serializationVersion: 1,
    id: "vfx_test_1",
    definitionId: "test.burst",
    displayName: "Test Burst Instance",
    startFrame: 10,
    durationFrames: 20,
    enabled: true,
    space: "world",
    transform: {
      position: [1, 2, 3],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    },
    target: null,
    seed: "fixed-seed",
    parameters: { count: 12, direction: "radial" },
    parameterKeyframes: [],
    blendMode: "additive",
    renderLayer: "world",
    previewQuality: "medium",
    exportQuality: "final"
  };
}

function errorCodes(result: ReturnType<typeof validateVfxInstance>): string[] {
  return result.ok ? [] : result.errors.map((item) => item.code);
}

describe("VfxValidator", () => {
  it("accepts a valid definition and instance", () => {
    const definition = createDefinition();
    const definitionResult = validateVfxDefinition(definition);
    const instanceResult = validateVfxInstance(createInstance(), definition);

    expect(definitionResult.ok).toBe(true);
    expect(instanceResult.ok).toBe(true);
  });

  it("validates persisted parameter keyframes against the canonical schema", () => {
    const definition = createDefinition();
    const valid = {
      ...createInstance(),
      parameterKeyframes: [
        {
          id: "key_count_1",
          parameterId: "count",
          localFrame: 12,
          value: 16,
          interpolation: "linear" as const
        }
      ]
    };
    expect(validateVfxInstance(valid, definition).ok).toBe(true);

    const invalid = {
      ...valid,
      parameterKeyframes: [
        { ...valid.parameterKeyframes[0], value: 12.5 },
        { ...valid.parameterKeyframes[0], localFrame: -1 }
      ]
    };
    const result = validateVfxInstance(invalid, definition);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "VFX_PARAMETER_NOT_INTEGER",
        "VFX_PARAMETER_KEYFRAME_ID_DUPLICATE",
        "VFX_PARAMETER_KEYFRAME_FRAME_INVALID"
      ])
    );
  });

  it("warns about and preserves unknown primitive parameters", () => {
    const instance = {
      ...createInstance(),
      parameters: { ...createInstance().parameters, legacyExtra: 42 }
    };
    const result = validateVfxInstance(instance, createDefinition());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.warnings.map((item) => item.code)).toContain(
      "VFX_PARAMETER_UNKNOWN"
    );
    expect(result.value.parameters.legacyExtra).toBe(42);
  });

  it("rejects an invalid frame range and missing seed", () => {
    const instance = {
      ...createInstance(),
      startFrame: -1,
      durationFrames: 0,
      seed: ""
    };
    const codes = errorCodes(validateVfxInstance(instance, createDefinition()));

    expect(codes).toContain("VFX_START_FRAME_INVALID");
    expect(codes).toContain("VFX_DURATION_INVALID");
    expect(codes).toContain("VFX_SEED_REQUIRED");
  });

  it("rejects non-finite transform components", () => {
    const instance = {
      ...createInstance(),
      transform: {
        ...createInstance().transform,
        position: [0, Number.NaN, 0]
      }
    } as VfxInstance;

    expect(
      errorCodes(validateVfxInstance(instance, createDefinition()))
    ).toContain("VFX_TRANSFORM_INVALID");
  });

  it("rejects parameter type, integer, range, and enum violations", () => {
    const cases: Array<[unknown, unknown, string]> = [
      ["many", "radial", "VFX_PARAMETER_TYPE_MISMATCH"],
      [2.5, "radial", "VFX_PARAMETER_NOT_INTEGER"],
      [100, "radial", "VFX_PARAMETER_ABOVE_MAX"],
      [12, "sideways", "VFX_PARAMETER_ENUM_INVALID"]
    ];

    for (const [count, direction, expectedCode] of cases) {
      const instance = {
        ...createInstance(),
        parameters: { count, direction }
      } as VfxInstance;
      expect(
        errorCodes(validateVfxInstance(instance, createDefinition()))
      ).toContain(expectedCode);
    }
  });

  it("rejects an instance whose definition is missing", () => {
    expect(errorCodes(validateVfxInstance(createInstance(), null))).toContain(
      "VFX_DEFINITION_NOT_FOUND"
    );
  });

  it("rejects duplicate parameter schema IDs", () => {
    const definition = createDefinition();
    const duplicate = {
      ...definition,
      parameterSchema: [
        ...definition.parameterSchema,
        { ...definition.parameterSchema[0] }
      ]
    };
    const result = validateVfxDefinition(duplicate);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((item) => item.code)).toContain(
      "VFX_PARAMETER_ID_DUPLICATE"
    );
  });

  it("rejects a numeric default outside its declared range", () => {
    const definition = createDefinition();
    const invalid = {
      ...definition,
      parameterSchema: [
        {
          ...definition.parameterSchema[0],
          defaultValue: 100
        }
      ]
    } as VfxDefinition;
    const result = validateVfxDefinition(invalid);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((item) => item.code)).toContain(
      "VFX_PARAMETER_DEFAULT_ABOVE_MAX"
    );
  });

  it("aligns integer schema metadata and parameter ID bounds", () => {
    const definition = createDefinition();
    const longId = `a${"b".repeat(MAX_VFX_PARAMETER_ID_LENGTH)}`;
    const invalid = {
      ...definition,
      parameterSchema: [
        {
          ...definition.parameterSchema[0],
          id: longId,
          min: 0.5,
          step: 0.5
        }
      ]
    } as VfxDefinition;
    const result = validateVfxDefinition(invalid);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    const codes = result.errors.map((item) => item.code);
    expect(codes).toContain("VFX_PARAMETER_ID_INVALID");
    expect(codes).toContain("VFX_PARAMETER_MIN_INVALID");
    expect(codes).toContain("VFX_PARAMETER_STEP_INVALID");
  });

  it("reports malformed enum options without throwing", () => {
    const definition = {
      ...createDefinition(),
      parameterSchema: [
        {
          id: "mode",
          displayName: "Mode",
          animatable: false,
          kind: "enum",
          defaultValue: "radial",
          options: undefined
        }
      ]
    } as unknown as VfxDefinition;
    const result = validateVfxDefinition(definition);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((item) => item.code)).toContain(
      "VFX_PARAMETER_OPTIONS_INVALID"
    );
  });

  it("rejects unsafe color defaults and values while accepting named colors", () => {
    const definition = {
      ...createDefinition(),
      parameterSchema: [
        {
          id: "color",
          displayName: "Color",
          animatable: true,
          kind: "color",
          defaultValue: "rebeccapurple"
        }
      ]
    } as VfxDefinition;
    const instance = {
      ...createInstance(),
      parameters: { color: "red" }
    };

    expect(validateVfxDefinition(definition).ok).toBe(true);
    expect(validateVfxInstance(instance, definition).ok).toBe(true);
    expect(
      errorCodes(
        validateVfxInstance(
          {
            ...instance,
            parameters: { color: "url(http://localhost/)" }
          },
          definition
        )
      )
    ).toContain("VFX_PARAMETER_COLOR_INVALID");
    const unsafeDefinition = {
      ...definition,
      parameterSchema: [
        { ...definition.parameterSchema[0], defaultValue: "linear-gradient(red, blue)" }
      ]
    } as VfxDefinition;
    expect(validateVfxDefinition(unsafeDefinition).ok).toBe(false);
  });
});
