import { describe, expect, it } from "vitest";
import {
  VFX_PRIMITIVE_LIMITS,
  type VfxBeamDescriptor,
  type VfxExpandingRingDescriptor,
  type VfxLightPulseDescriptor,
  type VfxParticleEmitterDescriptor,
  type VfxPrimitiveDescriptor,
  type VfxTrailDescriptor
} from "./VfxPrimitiveTypes";
import { validateVfxPrimitiveDescriptor } from "./VfxPrimitiveValidator";

function particleDescriptor(): VfxParticleEmitterDescriptor {
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
    endOpacity: 0
  };
}

function beamDescriptor(): VfxBeamDescriptor {
  return {
    version: 1,
    id: "beam.main",
    kind: "beam",
    color: "#b9e7ff",
    start: [0, 0, 0],
    end: [0, 4, 0],
    subdivisions: 8,
    jitter: 0.25,
    width: 0.08,
    opacity: 0.9
  };
}

function trailDescriptor(): VfxTrailDescriptor {
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
    segments: 16,
    startWidth: 0.2,
    endWidth: 0.02,
    startOpacity: 1,
    endOpacity: 0
  };
}

function ringDescriptor(): VfxExpandingRingDescriptor {
  return {
    version: 1,
    id: "ring.main",
    kind: "expanding-ring",
    color: "#9ed6ff",
    center: [0, 0, 0],
    startRadius: 1,
    endRadius: 5,
    thickness: 0.05,
    segments: 32,
    startOpacity: 1,
    endOpacity: 0
  };
}

function lightDescriptor(): VfxLightPulseDescriptor {
  return {
    version: 1,
    id: "light.main",
    kind: "light-pulse",
    color: "#ffffff",
    center: [0, 1, 0],
    startRadius: 1,
    endRadius: 5,
    baseIntensity: 2,
    peakIntensity: 10
  };
}

function errorCodes(descriptor: VfxPrimitiveDescriptor): string[] {
  const result = validateVfxPrimitiveDescriptor(descriptor);
  return result.ok ? [] : result.errors.map((item) => item.code);
}

describe("validateVfxPrimitiveDescriptor", () => {
  it("accepts all five V1 primitive kinds", () => {
    for (const descriptor of [
      particleDescriptor(),
      beamDescriptor(),
      trailDescriptor(),
      ringDescriptor(),
      lightDescriptor()
    ]) {
      expect(validateVfxPrimitiveDescriptor(descriptor).ok).toBe(true);
    }
  });

  it("warns when safe work budgets will be clamped before allocation", () => {
    const descriptors: VfxPrimitiveDescriptor[] = [
      {
        ...particleDescriptor(),
        count: VFX_PRIMITIVE_LIMITS.particles + 1
      },
      {
        ...beamDescriptor(),
        subdivisions: VFX_PRIMITIVE_LIMITS.beamSubdivisions + 1
      },
      {
        ...trailDescriptor(),
        segments: VFX_PRIMITIVE_LIMITS.trailSegments + 1
      },
      {
        ...ringDescriptor(),
        segments: VFX_PRIMITIVE_LIMITS.ringSegments + 1
      }
    ];

    for (const descriptor of descriptors) {
      const result = validateVfxPrimitiveDescriptor(descriptor);
      expect(result.ok).toBe(true);
      expect(result.warnings.map((item) => item.code)).toEqual([
        "VFX_PRIMITIVE_BUDGET_CLAMPED"
      ]);
    }
  });

  it("rejects unsupported versions, kinds, IDs, and colors", () => {
    const cases: VfxPrimitiveDescriptor[] = [
      { ...particleDescriptor(), version: 2 } as unknown as VfxPrimitiveDescriptor,
      { ...particleDescriptor(), kind: "smoke" } as unknown as VfxPrimitiveDescriptor,
      { ...particleDescriptor(), id: "not valid" },
      { ...particleDescriptor(), color: "" }
    ];
    const expected = [
      "VFX_PRIMITIVE_VERSION_UNSUPPORTED",
      "VFX_PRIMITIVE_KIND_UNSUPPORTED",
      "VFX_PRIMITIVE_ID_INVALID",
      "VFX_PRIMITIVE_COLOR_INVALID"
    ];

    cases.forEach((descriptor, index) => {
      expect(errorCodes(descriptor)).toContain(expected[index]);
    });
  });

  it("rejects malformed particle values and spawn shapes", () => {
    const cases: Array<[VfxParticleEmitterDescriptor, string]> = [
      [{ ...particleDescriptor(), count: 1.5 }, "VFX_PRIMITIVE_INTEGER_INVALID"],
      [{ ...particleDescriptor(), radius: -1 }, "VFX_PRIMITIVE_NUMBER_INVALID"],
      [
        { ...particleDescriptor(), speed: Number.POSITIVE_INFINITY },
        "VFX_PRIMITIVE_NUMBER_INVALID"
      ],
      [
        { ...particleDescriptor(), lifetimeSeconds: 0 },
        "VFX_PRIMITIVE_NUMBER_INVALID"
      ],
      [
        { ...particleDescriptor(), startOpacity: 1.1 },
        "VFX_PRIMITIVE_NUMBER_INVALID"
      ],
      [
        { ...particleDescriptor(), shape: "mesh" as "point" },
        "VFX_PRIMITIVE_ENUM_INVALID"
      ]
    ];

    for (const [descriptor, code] of cases) {
      expect(errorCodes(descriptor)).toContain(code);
    }
  });

  it("rejects malformed beam, trail, ring, and light configuration", () => {
    const tooManyPoints = Array.from(
      { length: VFX_PRIMITIVE_LIMITS.trailControlPoints + 1 },
      (_, index) => [index, 0, 0] as [number, number, number]
    );
    const cases: Array<[VfxPrimitiveDescriptor, string]> = [
      [
        { ...beamDescriptor(), end: [0, Number.NaN, 0] },
        "VFX_PRIMITIVE_VECTOR_INVALID"
      ],
      [{ ...beamDescriptor(), width: 0 }, "VFX_PRIMITIVE_NUMBER_INVALID"],
      [{ ...trailDescriptor(), points: [[0, 0, 0]] }, "VFX_PRIMITIVE_POINTS_INVALID"],
      [
        { ...trailDescriptor(), points: tooManyPoints },
        "VFX_PRIMITIVE_POINTS_INVALID"
      ],
      [{ ...ringDescriptor(), segments: 2 }, "VFX_PRIMITIVE_INTEGER_INVALID"],
      [
        { ...lightDescriptor(), peakIntensity: 1 },
        "VFX_PRIMITIVE_RANGE_INVALID"
      ]
    ];

    for (const [descriptor, code] of cases) {
      expect(errorCodes(descriptor)).toContain(code);
    }
  });

  it("rejects sparse vector tuples without iterating unbounded point lists", () => {
    const sparse = new Array(3) as [number, number, number];
    sparse[0] = 0;
    sparse[2] = 0;
    expect(errorCodes({ ...beamDescriptor(), end: sparse })).toContain(
      "VFX_PRIMITIVE_VECTOR_INVALID"
    );

    const oversized = {
      ...trailDescriptor(),
      points: new Array(VFX_PRIMITIVE_LIMITS.trailControlPoints + 1).fill([
        0,
        0,
        0
      ])
    };
    expect(errorCodes(oversized)).toContain("VFX_PRIMITIVE_POINTS_INVALID");
  });

  it("returns a typed error for non-object input without throwing", () => {
    expect(() =>
      validateVfxPrimitiveDescriptor(null as unknown as VfxPrimitiveDescriptor)
    ).not.toThrow();
    expect(
      errorCodes(null as unknown as VfxPrimitiveDescriptor)
    ).toContain("VFX_PRIMITIVE_DESCRIPTOR_INVALID");
  });

  it("rejects inherited, class, and accessor-backed descriptors", () => {
    const inherited = Object.create(particleDescriptor()) as VfxPrimitiveDescriptor;
    class DescriptorClass {
      constructor() {
        Object.assign(this, particleDescriptor());
      }
    }
    const accessor = { ...particleDescriptor() } as VfxPrimitiveDescriptor;
    Object.defineProperty(accessor, "color", {
      get() {
        throw new Error("descriptor accessors must not execute");
      },
      enumerable: true
    });
    const nonEnumerable = {
      ...particleDescriptor()
    } as VfxPrimitiveDescriptor;
    Object.defineProperty(nonEnumerable, "color", {
      value: "#ffffff",
      enumerable: false
    });

    expect(JSON.stringify(inherited)).toBe("{}");
    expect(errorCodes(inherited)).toContain("VFX_PRIMITIVE_DESCRIPTOR_INVALID");
    expect(
      errorCodes(new DescriptorClass() as unknown as VfxPrimitiveDescriptor)
    ).toContain("VFX_PRIMITIVE_DESCRIPTOR_INVALID");
    expect(() => validateVfxPrimitiveDescriptor(accessor)).not.toThrow();
    expect(errorCodes(accessor)).toContain("VFX_PRIMITIVE_COLOR_INVALID");
    expect(errorCodes(nonEnumerable)).toContain("VFX_PRIMITIVE_COLOR_INVALID");
  });

  it("rejects an oversized color before trimming its content", () => {
    const result = validateVfxPrimitiveDescriptor({
      ...particleDescriptor(),
      color: ` ${"x".repeat(1_000_000)} `
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((item) => item.code)).toContain(
      "VFX_PRIMITIVE_COLOR_INVALID"
    );
  });
});
