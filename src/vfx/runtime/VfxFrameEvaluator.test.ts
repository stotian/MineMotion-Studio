import { afterEach, describe, expect, it, vi } from "vitest";
import { createEffectInstance } from "../../effects/EffectRegistry";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createInitialProject } from "../../project/ProjectStore";
import {
  adaptLegacyEffectInstance,
  createLegacyVfxRegistry
} from "../compat/LegacyEffectAdapter";
import type { VfxDefinition } from "../core/VfxDefinition";
import type { VfxEvaluationContext } from "../core/VfxEvaluationContext";
import type { VfxInstance } from "../core/VfxInstance";
import {
  evaluateVfxFrame,
  type VfxActiveFrameEvaluation,
  type VfxFrameEvaluationResult
} from "./VfxFrameEvaluator";

function createDefinition(): VfxDefinition {
  return {
    version: 1,
    id: "test.burst",
    displayName: "Test Burst",
    description: "Deterministic evaluator fixture.",
    space: "world",
    defaultDurationFrames: 20,
    defaultBlendMode: "additive",
    defaultRenderLayer: "world",
    parameterSchema: [
      {
        id: "mode",
        displayName: "Mode",
        animatable: false,
        kind: "enum",
        defaultValue: "radial",
        options: ["forward", "radial"]
      },
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
        id: "intensity",
        displayName: "Intensity",
        animatable: true,
        kind: "number",
        defaultValue: 1,
        min: 0,
        max: 4
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
      position: [1, -0, 3],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    },
    target: { entityId: "character_steve" },
    seed: "instance-seed",
    parameters: { legacyExtra: 42, count: 12 },
    parameterKeyframes: [],
    blendMode: "additive",
    renderLayer: "world",
    previewQuality: "medium",
    exportQuality: "final"
  };
}

function createContext(
  frame: number,
  overrides: Partial<VfxEvaluationContext> = {}
): VfxEvaluationContext {
  return {
    frame,
    fps: 24,
    seed: "project-seed",
    quality: "high",
    ...overrides
  };
}

function requireActive(
  result: VfxFrameEvaluationResult
): VfxActiveFrameEvaluation {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.errors.map((item) => item.code).join(", "));
  }
  expect(result.value.status).toBe("active");
  if (result.value.status !== "active") {
    throw new Error(`Expected active evaluation, got ${result.value.status}.`);
  }
  return result.value;
}

function errorCodes(result: VfxFrameEvaluationResult): string[] {
  return result.ok ? [] : result.errors.map((item) => item.code);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("evaluateVfxFrame", () => {
  it("returns exact active timing, seed, quality, and resolved input data", () => {
    const result = evaluateVfxFrame(
      createInstance(),
      createDefinition(),
      createContext(20)
    );
    const active = requireActive(result);

    expect(active).toEqual({
      status: "active",
      instanceId: "vfx_test_1",
      definitionId: "test.burst",
      frame: 20,
      fps: 24,
      localFrame: 10,
      progress: 0.5,
      localSeconds: 10 / 24,
      durationSeconds: 20 / 24,
      rootSeed: 921511647,
      frameSeed: 538752374,
      frameRandom: 0.22249360149726272,
      quality: "high",
      qualityScale: 0.75,
      inputs: {
        space: "world",
        transform: {
          position: [1, 0, 3],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        target: { entityId: "character_steve" },
        parameters: {
          count: 12,
          intensity: 1,
          legacyExtra: 42,
          mode: "radial"
        },
        blendMode: "additive",
        renderLayer: "world"
      }
    });
    expect(result.warnings.map((item) => item.code)).toEqual([
      "VFX_PARAMETER_UNKNOWN"
    ]);
  });

  it("preserves inclusive timing and explicit inactive reasons", () => {
    const definition = createDefinition();
    const instance = createInstance();

    expect(
      evaluateVfxFrame(instance, definition, createContext(9))
    ).toMatchObject({ ok: true, value: { status: "inactive", reason: "before-start" } });
    expect(requireActive(evaluateVfxFrame(instance, definition, createContext(10)))).toMatchObject({
      localFrame: 0,
      progress: 0,
      localSeconds: 0
    });
    expect(requireActive(evaluateVfxFrame(instance, definition, createContext(30)))).toMatchObject({
      localFrame: 20,
      progress: 1,
      localSeconds: 20 / 24
    });
    expect(
      evaluateVfxFrame(instance, definition, createContext(31))
    ).toMatchObject({ ok: true, value: { status: "inactive", reason: "after-end" } });
    expect(
      evaluateVfxFrame(
        { ...instance, enabled: false },
        definition,
        createContext(9)
      )
    ).toMatchObject({ ok: true, value: { status: "inactive", reason: "disabled" } });
  });

  it("validates every explicit context coordinate without rounding", () => {
    const definition = createDefinition();
    const instance = createInstance();
    for (const frame of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
      expect(errorCodes(evaluateVfxFrame(instance, definition, createContext(frame)))).toContain(
        "VFX_CONTEXT_FRAME_INVALID"
      );
    }
    for (const fps of [0, -1, Number.MIN_VALUE, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(
        errorCodes(evaluateVfxFrame(instance, definition, createContext(10, { fps })))
      ).toContain("VFX_CONTEXT_FPS_INVALID");
    }
    for (const seed of ["", "   "]) {
      expect(
        errorCodes(evaluateVfxFrame(instance, definition, createContext(10, { seed })))
      ).toContain("VFX_CONTEXT_SEED_REQUIRED");
    }
    expect(
      errorCodes(
        evaluateVfxFrame(
          instance,
          definition,
          createContext(10, { seed: 42 as unknown as string })
        )
      )
    ).toContain("VFX_CONTEXT_SEED_REQUIRED");
    expect(
      errorCodes(
        evaluateVfxFrame(
          instance,
          definition,
          createContext(10, { quality: "ultra" as VfxEvaluationContext["quality"] })
        )
      )
    ).toContain("VFX_CONTEXT_QUALITY_INVALID");
    expect(
      evaluateVfxFrame(instance, definition, createContext(10, { fps: 23.976 })).ok
    ).toBe(true);
  });

  it("validates definition and instance data before inactive evaluation", () => {
    const invalidDefinition = {
      ...createDefinition(),
      version: 99
    } as unknown as VfxDefinition;
    expect(
      errorCodes(evaluateVfxFrame(createInstance(), invalidDefinition, createContext(10)))
    ).toContain("VFX_DEFINITION_VERSION_UNSUPPORTED");
    expect(
      errorCodes(evaluateVfxFrame(createInstance(), null, createContext(10)))
    ).toContain("VFX_DEFINITION_NOT_FOUND");
    expect(
      errorCodes(
        evaluateVfxFrame(
          { ...createInstance(), enabled: false, seed: "" },
          createDefinition(),
          createContext(10)
        )
      )
    ).toContain("VFX_SEED_REQUIRED");
    expect(
      errorCodes(
        evaluateVfxFrame(
          {
            ...createInstance(),
            startFrame: Number.MAX_SAFE_INTEGER,
            durationFrames: 1
          },
          createDefinition(),
          createContext(10)
        )
      )
    ).toContain("VFX_FRAME_RANGE_INVALID");
    expect(() =>
      evaluateVfxFrame(
        undefined as unknown as VfxInstance,
        createDefinition(),
        createContext(10)
      )
    ).not.toThrow();
    expect(
      errorCodes(
        evaluateVfxFrame(
          undefined as unknown as VfxInstance,
          createDefinition(),
          createContext(10)
        )
      )
    ).toContain("VFX_INSTANCE_INVALID");
    expect(
      errorCodes(
        evaluateVfxFrame(
          createInstance(),
          [] as unknown as VfxDefinition,
          createContext(10)
        )
      )
    ).toContain("VFX_DEFINITION_INVALID");
    expect(
      errorCodes(
        evaluateVfxFrame(
          createInstance(),
          createDefinition(),
          null as unknown as VfxEvaluationContext
        )
      )
    ).toContain("VFX_CONTEXT_INVALID");
  });

  it("is byte-equivalent when repeated, reordered, cloned, and JSON reloaded", () => {
    const definition = createDefinition();
    const instance = createInstance();
    const inputBefore = JSON.stringify(instance);
    const expected = new Map(
      [10, 20, 30].map((frame) => [
        frame,
        JSON.stringify(evaluateVfxFrame(instance, definition, createContext(frame)))
      ])
    );

    for (const frame of [30, 10, 20, 10, 30]) {
      expect(
        JSON.stringify(evaluateVfxFrame(instance, definition, createContext(frame)))
      ).toBe(expected.get(frame));
    }

    const steppedOracle = new Map(
      [10, 11, 12].map((frame) => [
        frame,
        JSON.stringify(evaluateVfxFrame(instance, definition, createContext(frame)))
      ])
    );
    for (const frame of [10, 11, 12, 11, 10, 12]) {
      expect(
        JSON.stringify(evaluateVfxFrame(instance, definition, createContext(frame)))
      ).toBe(steppedOracle.get(frame));
    }

    const structured = structuredClone(instance);
    const reloaded = JSON.parse(JSON.stringify(instance)) as VfxInstance;
    expect(
      JSON.stringify(evaluateVfxFrame(structured, definition, createContext(20)))
    ).toBe(expected.get(20));
    expect(
      JSON.stringify(evaluateVfxFrame(reloaded, definition, createContext(20)))
    ).toBe(expected.get(20));
    expect(JSON.stringify(instance)).toBe(inputBefore);
  });

  it("uses no ambient entropy and remains cloneable and JSON-safe", () => {
    vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("ambient random is forbidden");
    });
    vi.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("wall-clock time is forbidden");
    });
    vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => {
      throw new Error("UUID entropy is forbidden");
    });
    vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation(() => {
      throw new Error("crypto entropy is forbidden");
    });
    vi.spyOn(globalThis.performance, "now").mockImplementation(() => {
      throw new Error("performance clock is forbidden");
    });

    const result = evaluateVfxFrame(
      createInstance(),
      createDefinition(),
      createContext(20)
    );
    expect(structuredClone(result)).toEqual(result);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });

  it("keeps the random stream stable while quality changes explicitly", () => {
    const results = (["draft", "medium", "high", "final"] as const).map((quality) =>
      requireActive(
        evaluateVfxFrame(
          createInstance(),
          createDefinition(),
          createContext(20, { quality })
        )
      )
    );

    expect(results.map((value) => value.qualityScale)).toEqual([0.25, 0.5, 0.75, 1]);
    expect(new Set(results.map((value) => value.rootSeed)).size).toBe(1);
    expect(new Set(results.map((value) => value.frameSeed)).size).toBe(1);
    expect(new Set(results.map((value) => value.frameRandom)).size).toBe(1);

    const normalized = results.map(({ quality: _quality, qualityScale: _scale, ...rest }) => rest);
    expect(normalized.every((value) => JSON.stringify(value) === JSON.stringify(normalized[0]))).toBe(
      true
    );
  });

  it("uses supplied FPS only for seconds and supplied seed only for randomness", () => {
    const base = requireActive(
      evaluateVfxFrame(createInstance(), createDefinition(), createContext(20))
    );
    const otherFps = requireActive(
      evaluateVfxFrame(
        createInstance(),
        createDefinition(),
        createContext(20, { fps: 48 })
      )
    );
    const otherSeed = requireActive(
      evaluateVfxFrame(
        createInstance(),
        createDefinition(),
        createContext(20, { seed: "other-project" })
      )
    );

    expect(otherFps.localSeconds).toBe(base.localSeconds / 2);
    expect(otherFps.durationSeconds).toBe(base.durationSeconds / 2);
    expect(otherFps.rootSeed).toBe(base.rootSeed);
    expect(otherFps.frameSeed).toBe(base.frameSeed);
    expect(otherSeed.rootSeed).not.toBe(base.rootSeed);
    expect(otherSeed.localFrame).toBe(base.localFrame);
    expect(otherSeed.progress).toBe(base.progress);
  });

  it("addresses temporal randomness by local frame when an effect is moved", () => {
    const original = requireActive(
      evaluateVfxFrame(createInstance(), createDefinition(), createContext(20))
    );
    const moved = requireActive(
      evaluateVfxFrame(
        { ...createInstance(), startFrame: 100 },
        createDefinition(),
        createContext(110)
      )
    );

    expect(moved.localFrame).toBe(original.localFrame);
    expect(moved.frameSeed).toBe(original.frameSeed);
    expect(moved.frameRandom).toBe(original.frameRandom);
  });

  it("returns fresh primitive inputs without aliases to the instance", () => {
    const instance = createInstance();
    const active = requireActive(
      evaluateVfxFrame(instance, createDefinition(), createContext(20))
    );
    active.inputs.transform.position[0] = 999;
    (active.inputs.parameters as Record<string, string | number | boolean>).count = 1;

    expect(instance.transform.position[0]).toBe(1);
    expect(instance.parameters.count).toBe(12);
  });

  it("evaluates local parameter keyframes without timeline-position drift", () => {
    const instance = {
      ...createInstance(),
      parameterKeyframes: [
        {
          id: "intensity_start",
          parameterId: "intensity",
          localFrame: 2,
          value: 1,
          interpolation: "linear" as const
        },
        {
          id: "intensity_end",
          parameterId: "intensity",
          localFrame: 10,
          value: 3,
          interpolation: "constant" as const
        }
      ]
    };
    const before = requireActive(
      evaluateVfxFrame(instance, createDefinition(), createContext(11))
    );
    const middle = requireActive(
      evaluateVfxFrame(instance, createDefinition(), createContext(16))
    );
    const end = requireActive(
      evaluateVfxFrame(instance, createDefinition(), createContext(20))
    );
    const moved = requireActive(
      evaluateVfxFrame(
        { ...instance, startFrame: 100 },
        createDefinition(),
        createContext(106)
      )
    );

    expect(before.inputs.parameters.intensity).toBe(1);
    expect(middle.inputs.parameters.intensity).toBe(2);
    expect(end.inputs.parameters.intensity).toBe(3);
    expect(moved.inputs.parameters).toEqual(middle.inputs.parameters);
  });

  it("orders Unicode and punctuation parameter keys by stable code units", () => {
    const instance = {
      ...createInstance(),
      parameters: {
        ...createInstance().parameters,
        "é": 1,
        Z: 2,
        _: 3,
        "Ä": 4
      }
    };
    const active = requireActive(
      evaluateVfxFrame(instance, createDefinition(), createContext(20))
    );

    expect(Object.keys(active.inputs.parameters)).toEqual([
      "Z",
      "_",
      "count",
      "intensity",
      "legacyExtra",
      "mode",
      "Ä",
      "é"
    ]);
  });

  it("matches after a real schema 9 to 10 project migration path", () => {
    const legacy = createEffectInstance("glowBurst", {
      id: "effect_reload_test",
      startFrame: 12,
      position: [1, 2, 3],
      parameters: { count: 24, radius: 3 }
    });
    const project = createInitialProject();
    project.effects.instances = [legacy];
    const reloaded = ProjectSerializer.parse(
      JSON.stringify({ ...project, schemaVersion: 9 })
    );
    const definition = createLegacyVfxRegistry().get("glowBurst");
    expect(definition).not.toBeNull();

    const before = evaluateVfxFrame(
      adaptLegacyEffectInstance(project.effects.instances[0]),
      definition,
      createContext(20)
    );
    const after = evaluateVfxFrame(
      adaptLegacyEffectInstance(reloaded.effects.instances[0]),
      definition,
      createContext(20)
    );
    expect(JSON.stringify(after)).toBe(JSON.stringify(before));
  });

});
