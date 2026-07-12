import { afterEach, describe, expect, it, vi } from "vitest";
import type { VfxDefinition } from "../core/VfxDefinition";
import type { VfxInstance } from "../core/VfxInstance";
import {
  evaluateVfxFrame,
  VFX_QUALITY_SCALES,
  type VfxActiveFrameEvaluation
} from "../runtime/VfxFrameEvaluator";
import { evaluateVfxPrimitive } from "./VfxPrimitiveEvaluator";
import {
  VFX_PRIMITIVE_LIMITS,
  type VfxBeamDescriptor,
  type VfxExpandingRingDescriptor,
  type VfxLightPulseDescriptor,
  type VfxParticleEmitterDescriptor,
  type VfxPrimitiveDescriptor,
  type VfxPrimitiveEvaluation,
  type VfxTrailDescriptor
} from "./VfxPrimitiveTypes";

function activeFrame(
  overrides: Partial<VfxActiveFrameEvaluation> = {}
): VfxActiveFrameEvaluation {
  return {
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
    quality: "final",
    qualityScale: 1,
    inputs: {
      space: "world",
      transform: {
        position: [1, 0, 3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      },
      target: { entityId: "character_steve" },
      parameters: {},
      blendMode: "additive",
      renderLayer: "world"
    },
    ...overrides
  };
}

function withQuality(
  quality: VfxActiveFrameEvaluation["quality"]
): VfxActiveFrameEvaluation {
  const scale = { draft: 0.25, medium: 0.5, high: 0.75, final: 1 }[quality];
  return activeFrame({ quality, qualityScale: scale });
}

function particleDescriptor(
  overrides: Partial<VfxParticleEmitterDescriptor> = {}
): VfxParticleEmitterDescriptor {
  return {
    version: 1,
    id: "particles.main",
    kind: "particle-emitter",
    color: "#ffe27a",
    count: 8,
    shape: "point",
    radius: 0,
    speed: 3,
    lifetimeSeconds: 2,
    startSize: 0.2,
    endSize: 0.1,
    startOpacity: 1,
    endOpacity: 0,
    ...overrides
  };
}

function beamDescriptor(
  overrides: Partial<VfxBeamDescriptor> = {}
): VfxBeamDescriptor {
  return {
    version: 1,
    id: "beam.main",
    kind: "beam",
    color: "#b9e7ff",
    start: [0, 0, 0],
    end: [0, 4, 0],
    subdivisions: 4,
    jitter: 0.25,
    width: 0.08,
    opacity: 0.9,
    ...overrides
  };
}

function trailDescriptor(
  overrides: Partial<VfxTrailDescriptor> = {}
): VfxTrailDescriptor {
  return {
    version: 1,
    id: "trail.main",
    kind: "trail",
    color: "#ffffff",
    points: [
      [0, 0, 0],
      [1, 1, 0],
      [2, 0, 0]
    ],
    segments: 8,
    startWidth: 0.2,
    endWidth: 0.02,
    startOpacity: 1,
    endOpacity: 0,
    ...overrides
  };
}

function ringDescriptor(
  overrides: Partial<VfxExpandingRingDescriptor> = {}
): VfxExpandingRingDescriptor {
  return {
    version: 1,
    id: "ring.main",
    kind: "expanding-ring",
    color: "#9ed6ff",
    center: [0, 0, 0],
    startRadius: 1,
    endRadius: 5,
    thickness: 0.05,
    segments: 8,
    startOpacity: 1,
    endOpacity: 0,
    ...overrides
  };
}

function lightDescriptor(
  overrides: Partial<VfxLightPulseDescriptor> = {}
): VfxLightPulseDescriptor {
  return {
    version: 1,
    id: "light.main",
    kind: "light-pulse",
    color: "#ffffff",
    center: [0, 1, 0],
    startRadius: 1,
    endRadius: 5,
    baseIntensity: 2,
    peakIntensity: 10,
    ...overrides
  };
}

function requireOutput(
  result: ReturnType<typeof evaluateVfxPrimitive>
): VfxPrimitiveEvaluation {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.errors.map((item) => item.code).join(", "));
  }
  return result.value;
}

function expectNestedSamples<T extends { sampleIndex: number }>(
  lower: readonly T[],
  higher: readonly T[]
): void {
  const higherByIndex = new Map(higher.map((sample) => [sample.sampleIndex, sample]));
  for (const sample of lower) {
    expect(higherByIndex.get(sample.sampleIndex)).toEqual(sample);
  }
}

function expectPlainFinite(value: unknown): void {
  if (typeof value === "number") {
    expect(Number.isFinite(value)).toBe(true);
    expect(Object.is(value, -0)).toBe(false);
    return;
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return;
  }
  expect(typeof value).not.toBe("undefined");
  expect(typeof value).not.toBe("function");
  if (Array.isArray(value)) {
    value.forEach(expectPlainFinite);
    return;
  }
  expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
  Object.values(value as Record<string, unknown>).forEach(expectPlainFinite);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("evaluateVfxPrimitive", () => {
  it("dispatches all five primitive kinds to cloneable plain outputs", () => {
    const descriptors: VfxPrimitiveDescriptor[] = [
      particleDescriptor(),
      beamDescriptor(),
      trailDescriptor(),
      ringDescriptor(),
      lightDescriptor()
    ];

    const outputs = descriptors.map((descriptor) =>
      requireOutput(evaluateVfxPrimitive(activeFrame(), descriptor))
    );
    expect(outputs.map((output) => output.kind)).toEqual([
      "particle-emitter",
      "beam",
      "trail",
      "expanding-ring",
      "light-pulse"
    ]);
    outputs.forEach((output) => {
      expect(structuredClone(output)).toEqual(output);
      expect(JSON.parse(JSON.stringify(output))).toEqual(output);
      expectPlainFinite(output);
    });
  });

  it("keeps a fixed particle seed and sample vector", () => {
    const output = requireOutput(
      evaluateVfxPrimitive(activeFrame(), particleDescriptor({ count: 2 }))
    );
    expect(output.kind).toBe("particle-emitter");
    if (output.kind !== "particle-emitter") return;

    expect(output.primitiveSeed).toBe(4106782897);
    expect(output.age).toBe(10 / 48);
    expect(output.particles[0]).toEqual({
      sampleIndex: 0,
      position: [
        -0.24653555682982425,
        0.7130891247652471,
        0.9966063010839046
      ],
      velocity: [
        -0.5916853363915782,
        1.711413899436593,
        2.3918551226013713
      ],
      size: 0.17916666666666667,
      opacity: 0.7916666666666666
    });
  });

  it("clamps particle allocation and makes lower quality a literal prefix", () => {
    const descriptor = particleDescriptor({
      count: VFX_PRIMITIVE_LIMITS.particles + 100
    });
    const draftResult = evaluateVfxPrimitive(withQuality("draft"), descriptor);
    const finalResult = evaluateVfxPrimitive(withQuality("final"), descriptor);
    const draft = requireOutput(draftResult);
    const final = requireOutput(finalResult);
    expect(draft.kind).toBe("particle-emitter");
    expect(final.kind).toBe("particle-emitter");
    if (draft.kind !== "particle-emitter" || final.kind !== "particle-emitter") {
      return;
    }

    expect(final.budget).toEqual({
      requested: VFX_PRIMITIVE_LIMITS.particles + 100,
      capped: VFX_PRIMITIVE_LIMITS.particles,
      evaluated: VFX_PRIMITIVE_LIMITS.particles,
      hardCap: VFX_PRIMITIVE_LIMITS.particles
    });
    expect(draft.budget.evaluated).toBe(VFX_PRIMITIVE_LIMITS.particles / 4);
    expect(draft.particles).toEqual(
      final.particles.slice(0, draft.budget.evaluated)
    );
    expect(finalResult.warnings.map((item) => item.code)).toEqual([
      "VFX_PRIMITIVE_BUDGET_CLAMPED"
    ]);
  });

  it("keeps existing particle identities stable when requested count grows", () => {
    const small = requireOutput(
      evaluateVfxPrimitive(activeFrame(), particleDescriptor({ count: 8 }))
    );
    const large = requireOutput(
      evaluateVfxPrimitive(activeFrame(), particleDescriptor({ count: 16 }))
    );
    expect(small.kind).toBe("particle-emitter");
    expect(large.kind).toBe("particle-emitter");
    if (small.kind !== "particle-emitter" || large.kind !== "particle-emitter") {
      return;
    }
    expect(small.particles).toEqual(large.particles.slice(0, 8));
  });

  it("supports deterministic point, sphere, ring, and box particle shapes", () => {
    const outputs = (["point", "sphere", "ring", "box"] as const).map((shape) => {
      const output = requireOutput(
        evaluateVfxPrimitive(
          activeFrame({ localSeconds: 0 }),
          particleDescriptor({ count: 1, shape, radius: 2 })
        )
      );
      expect(output.kind).toBe("particle-emitter");
      if (output.kind !== "particle-emitter") throw new Error("Wrong kind");
      return output.particles[0].position;
    });

    expect(outputs[0]).toEqual([0, 0, 0]);
    expect(outputs[1]).not.toEqual(outputs[0]);
    expect(outputs[2][1]).toBe(0);
    expect(outputs[3]).not.toEqual(outputs[0]);
  });

  it("returns no burst particles after their finite lifetime", () => {
    const output = requireOutput(
      evaluateVfxPrimitive(
        activeFrame({ localSeconds: 3 }),
        particleDescriptor({ lifetimeSeconds: 2 })
      )
    );
    expect(output.kind).toBe("particle-emitter");
    if (output.kind !== "particle-emitter") return;
    expect(output.age).toBe(1);
    expect(output.budget.evaluated).toBe(0);
    expect(output.particles).toEqual([]);
  });

  it("keeps fixed beam endpoints and midpoint jitter", () => {
    const output = requireOutput(
      evaluateVfxPrimitive(activeFrame(), beamDescriptor())
    );
    expect(output.kind).toBe("beam");
    if (output.kind !== "beam") return;

    expect(output.primitiveSeed).toBe(2202163350);
    expect(output.points[0]).toEqual({ sampleIndex: 0, position: [0, 0, 0] });
    expect(output.points[2]).toEqual({
      sampleIndex: 2,
      position: [
        -0.17895265272818506,
        1.7802797968033701,
        -0.034375990624539554
      ]
    });
    expect(output.points.at(-1)).toEqual({
      sampleIndex: 4,
      position: [0, 4, 0]
    });
  });

  it("adds nested beam, trail, and ring samples as quality rises", () => {
    const descriptors = [
      beamDescriptor({ subdivisions: 64 }),
      trailDescriptor({ segments: 64 }),
      ringDescriptor({ segments: 64 })
    ] as const;

    for (const descriptor of descriptors) {
      const qualities = (["draft", "medium", "high", "final"] as const).map(
        (quality) => requireOutput(evaluateVfxPrimitive(withQuality(quality), descriptor))
      );
      for (let index = 0; index < qualities.length - 1; index += 1) {
        const lower = qualities[index];
        const higher = qualities[index + 1];
        if (!("points" in lower) || !("points" in higher)) {
          throw new Error("Expected geometric primitive points.");
        }
        expectNestedSamples(lower.points, higher.points);
      }
      const first = qualities[0];
      const last = qualities.at(-1);
      if (!("points" in first) || !last || !("points" in last)) {
        throw new Error("Expected geometric primitive points.");
      }
      expect(first.points[0]).toEqual(last.points[0]);
      expect(first.points.at(-1)).toEqual(last.points.at(-1));
    }
  });

  it("interpolates ring and light pulse envelopes from frame progress", () => {
    const states = [
      activeFrame({ progress: 0 }),
      activeFrame({ progress: 0.5 }),
      activeFrame({ progress: 1 })
    ];
    const rings = states.map((frame) =>
      requireOutput(evaluateVfxPrimitive(frame, ringDescriptor()))
    );
    const lights = states.map((frame) =>
      requireOutput(evaluateVfxPrimitive(frame, lightDescriptor()))
    );

    expect(rings.map((output) => (output.kind === "expanding-ring" ? output.radius : -1))).toEqual([
      1,
      3,
      5
    ]);
    expect(
      rings.map((output) => (output.kind === "expanding-ring" ? output.opacity : -1))
    ).toEqual([1, 0.5, 0]);
    expect(lights.map((output) => (output.kind === "light-pulse" ? output.radius : -1))).toEqual([
      1,
      3,
      5
    ]);
    expect(
      lights.map((output) => (output.kind === "light-pulse" ? output.intensity : -1))
    ).toEqual([2, 10, 2]);
  });

  it("is independent of call order, descriptor order, clone, and JSON reload", () => {
    const descriptors: VfxPrimitiveDescriptor[] = [
      particleDescriptor(),
      beamDescriptor(),
      trailDescriptor(),
      ringDescriptor(),
      lightDescriptor()
    ];
    const expected = new Map(
      descriptors.map((descriptor) => [
        descriptor.id,
        JSON.stringify(evaluateVfxPrimitive(activeFrame(), descriptor))
      ])
    );

    for (const descriptor of [...descriptors].reverse()) {
      expect(JSON.stringify(evaluateVfxPrimitive(activeFrame(), descriptor))).toBe(
        expected.get(descriptor.id)
      );
      expect(
        JSON.stringify(
          evaluateVfxPrimitive(
            structuredClone(activeFrame()),
            JSON.parse(JSON.stringify(descriptor)) as VfxPrimitiveDescriptor
          )
        )
      ).toBe(expected.get(descriptor.id));
    }
  });

  it("changes random samples but not topology when only the root seed changes", () => {
    const first = requireOutput(
      evaluateVfxPrimitive(activeFrame(), particleDescriptor({ count: 4 }))
    );
    const second = requireOutput(
      evaluateVfxPrimitive(
        activeFrame({ rootSeed: 123456789 }),
        particleDescriptor({ count: 4 })
      )
    );
    expect(first.kind).toBe("particle-emitter");
    expect(second.kind).toBe("particle-emitter");
    if (first.kind !== "particle-emitter" || second.kind !== "particle-emitter") {
      return;
    }
    expect(second.particles.map((item) => item.sampleIndex)).toEqual(
      first.particles.map((item) => item.sampleIndex)
    );
    expect(second.particles[0].position).not.toEqual(first.particles[0].position);
  });

  it("returns fresh placement and sample data without mutating inputs", () => {
    const frame = activeFrame();
    const descriptor = particleDescriptor({ count: 1 });
    const beforeFrame = JSON.stringify(frame);
    const beforeDescriptor = JSON.stringify(descriptor);
    const output = requireOutput(evaluateVfxPrimitive(frame, descriptor));
    output.placement.transform.position[0] = 999;
    if (output.kind === "particle-emitter") {
      output.particles[0].position[0] = 999;
    }

    expect(JSON.stringify(frame)).toBe(beforeFrame);
    expect(JSON.stringify(descriptor)).toBe(beforeDescriptor);
  });

  it("accepts deeply frozen frame and descriptor inputs", () => {
    const frame = Object.freeze({
      ...activeFrame(),
      inputs: Object.freeze({
        ...activeFrame().inputs,
        transform: Object.freeze({
          position: Object.freeze([1, 0, 3]),
          rotation: Object.freeze([0, 0, 0]),
          scale: Object.freeze([1, 1, 1])
        })
      })
    }) as unknown as VfxActiveFrameEvaluation;
    const descriptor = Object.freeze({
      ...trailDescriptor(),
      points: Object.freeze(
        trailDescriptor().points.map((point) => Object.freeze([...point]))
      )
    }) as unknown as VfxTrailDescriptor;

    expect(evaluateVfxPrimitive(frame, descriptor).ok).toBe(true);
  });

  it("normalizes Array subclasses into plain tuple outputs", () => {
    class VectorSubclass extends Array<number> {}
    const center = new VectorSubclass(0, 0, 0) as unknown as [
      number,
      number,
      number
    ];
    const position = new VectorSubclass(1, 0, 3) as unknown as [
      number,
      number,
      number
    ];
    const frame = activeFrame({
      inputs: {
        ...activeFrame().inputs,
        transform: {
          ...activeFrame().inputs.transform,
          position
        }
      }
    });
    const output = requireOutput(
      evaluateVfxPrimitive(frame, ringDescriptor({ center }))
    );
    expect(output.kind).toBe("expanding-ring");
    if (output.kind !== "expanding-ring") return;

    expect(Object.getPrototypeOf(output.center)).toBe(Array.prototype);
    expect(Object.getPrototypeOf(output.placement.transform.position)).toBe(
      Array.prototype
    );
    output.points.forEach((point) => {
      expect(Object.getPrototypeOf(point.position)).toBe(Array.prototype);
    });
  });

  it("uses no random, UUID, crypto, or clock entropy", () => {
    vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("ambient random is forbidden");
    });
    vi.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("wall clock is forbidden");
    });
    vi.spyOn(globalThis.performance, "now").mockImplementation(() => {
      throw new Error("performance clock is forbidden");
    });
    vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => {
      throw new Error("UUID entropy is forbidden");
    });
    vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation(() => {
      throw new Error("crypto entropy is forbidden");
    });

    for (const descriptor of [
      particleDescriptor(),
      beamDescriptor(),
      trailDescriptor(),
      ringDescriptor(),
      lightDescriptor()
    ]) {
      expect(evaluateVfxPrimitive(activeFrame(), descriptor).ok).toBe(true);
    }
  });

  it("returns typed failures for malformed descriptors, frames, and overflow", () => {
    const malformed = evaluateVfxPrimitive(
      activeFrame(),
      null as unknown as VfxPrimitiveDescriptor
    );
    expect(malformed.ok).toBe(false);

    const inactive = evaluateVfxPrimitive(
      { ...activeFrame(), status: "inactive" } as unknown as VfxActiveFrameEvaluation,
      particleDescriptor()
    );
    expect(inactive.ok).toBe(false);
    if (!inactive.ok) {
      expect(inactive.errors.map((item) => item.code)).toContain(
        "VFX_PRIMITIVE_FRAME_INVALID"
      );
    }

    const overflow = evaluateVfxPrimitive(
      activeFrame({ localSeconds: Number.MAX_VALUE }),
      particleDescriptor({ speed: Number.MAX_VALUE, lifetimeSeconds: Number.MAX_VALUE })
    );
    expect(overflow.ok).toBe(false);
    if (!overflow.ok) {
      expect(overflow.errors.map((item) => item.code)).toContain(
        "VFX_PRIMITIVE_OUTPUT_NON_FINITE"
      );
    }
  });

  it("rejects inherited object-property names as forged quality levels", () => {
    for (const quality of ["toString", "constructor", "__proto__"] as const) {
      const scale = (VFX_QUALITY_SCALES as unknown as Record<string, unknown>)[
        quality
      ];
      const result = evaluateVfxPrimitive(
        activeFrame({
          quality: quality as unknown as VfxActiveFrameEvaluation["quality"],
          qualityScale: scale as number
        }),
        particleDescriptor()
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.map((item) => item.code)).toContain(
          "VFX_PRIMITIVE_FRAME_INVALID"
        );
      }
    }
  });

  it("rejects active-frame data inherited through a custom prototype", () => {
    const inherited = Object.create(activeFrame()) as VfxActiveFrameEvaluation;
    expect(JSON.stringify(inherited)).toBe("{}");
    const result = evaluateVfxPrimitive(inherited, particleDescriptor());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((item) => item.code)).toContain(
        "VFX_PRIMITIVE_FRAME_INVALID"
      );
    }
  });

  it("integrates with the inclusive Phase 15.2 frame evaluator", () => {
    const definition: VfxDefinition = {
      version: 1,
      id: "test.burst",
      displayName: "Test Burst",
      description: "Primitive integration fixture.",
      space: "world",
      defaultDurationFrames: 20,
      defaultBlendMode: "additive",
      defaultRenderLayer: "world",
      parameterSchema: [],
      tags: ["test"]
    };
    const instance: VfxInstance = {
      serializationVersion: 1,
      id: "vfx_test_1",
      definitionId: "test.burst",
      displayName: "Test Burst Instance",
      startFrame: 10,
      durationFrames: 20,
      enabled: true,
      space: "world",
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      },
      target: null,
      seed: "instance-seed",
      parameters: {},
      blendMode: "additive",
      renderLayer: "world",
      previewQuality: "medium",
      exportQuality: "final"
    };
    const frameResult = evaluateVfxFrame(instance, definition, {
      frame: 30,
      fps: 24,
      seed: "project-seed",
      quality: "final"
    });
    expect(frameResult.ok).toBe(true);
    if (!frameResult.ok || frameResult.value.status !== "active") return;

    const primitive = evaluateVfxPrimitive(
      frameResult.value,
      ringDescriptor()
    );
    expect(primitive.ok).toBe(true);
    if (!primitive.ok || primitive.value.kind !== "expanding-ring") return;
    expect(primitive.value.source.progress).toBe(1);
    expect(primitive.value.radius).toBe(5);
  });
});
