import { describe, expect, it } from "vitest";
import {
  DEFAULT_VFX_RESOURCE_POOL_LIMITS
} from "./VfxResourcePool";
import { estimateVfxPoolingAllocations } from "./VfxResourcePoolBenchmark";

describe("estimateVfxPoolingAllocations", () => {
  it("measures steady-state VFX-fight allocation churn reproducibly", () => {
    const estimate = estimateVfxPoolingAllocations(
      {
        frames: 120,
        particleSystemsPerFrame: 64,
        lightPulsesPerFrame: 16,
        dynamicMeshPrimitivesPerFrame: 16,
        dynamicLinePrimitivesPerFrame: 32
      },
      DEFAULT_VFX_RESOURCE_POOL_LIMITS
    );

    expect(estimate).toEqual({
      geometryAllocations: {
        before: 15_360,
        after: 5_762,
        saved: 9_598,
        reductionRatio: 9_598 / 15_360
      },
      materialAllocations: {
        before: 15_360,
        after: 128,
        saved: 15_232,
        reductionRatio: 15_232 / 15_360
      },
      particleBufferAllocations: {
        before: 7_680,
        after: 64,
        saved: 7_616,
        reductionRatio: 7_616 / 7_680
      }
    });
  });

  it("includes per-frame overflow without exceeding configured pools", () => {
    const estimate = estimateVfxPoolingAllocations(
      {
        frames: 3,
        particleSystemsPerFrame: 4,
        lightPulsesPerFrame: 0,
        dynamicMeshPrimitivesPerFrame: 0,
        dynamicLinePrimitivesPerFrame: 2
      },
      {
        meshMaterials: 2,
        lineMaterials: 1,
        particleMeshes: 2
      }
    );

    expect(estimate.materialAllocations).toMatchObject({
      before: 18,
      after: 12,
      saved: 6
    });
    expect(estimate.particleBufferAllocations).toMatchObject({
      before: 12,
      after: 8,
      saved: 4
    });
  });

  it("bounds hostile fixture values and reports empty work safely", () => {
    expect(
      estimateVfxPoolingAllocations(
        {
          frames: Number.NaN,
          particleSystemsPerFrame: Number.POSITIVE_INFINITY,
          lightPulsesPerFrame: -2,
          dynamicMeshPrimitivesPerFrame: -1,
          dynamicLinePrimitivesPerFrame: -4
        },
        {
          meshMaterials: 2,
          lineMaterials: 1,
          particleMeshes: 2
        }
      )
    ).toEqual({
      geometryAllocations: {
        before: 0,
        after: 0,
        saved: 0,
        reductionRatio: 0
      },
      materialAllocations: {
        before: 0,
        after: 0,
        saved: 0,
        reductionRatio: 0
      },
      particleBufferAllocations: {
        before: 0,
        after: 0,
        saved: 0,
        reductionRatio: 0
      }
    });
  });
});
