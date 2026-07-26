import { describe, expect, it } from "vitest";
import { PERFORMANCE_BUDGETS } from "./PerformanceBudgets";
import {
  CHUNK_INSTANCING_BENCHMARK_LIMITS,
  measureChunkInstancingStrategies,
  type ChunkInstancingWorkload
} from "./ChunkInstancingBenchmark";

const BLOCK_KINDS = Array.from(
  { length: 17 },
  (_, index) => `block_${index}`
);

function chunks(visible: number): ChunkInstancingWorkload[] {
  return Array.from({ length: 16 }, (_, index) => ({
    id: `chunk_${index}`,
    visible: index < visible,
    blockInstances: Object.fromEntries(
      BLOCK_KINDS.map((kind) => [kind, 10])
    )
  }));
}

describe("chunk instancing measurements", () => {
  it("keeps the default all-visible workload inside the Draft call budget", () => {
    const measured = measureChunkInstancingStrategies(chunks(16));

    expect(measured).toMatchObject({
      measuredChunks: 16,
      visibleChunks: 16,
      totalInstances: 2_720,
      visibleInstances: 2_720,
      sharedGeometrySavings: 15,
      globalMaterialBatches: {
        drawCalls: 17,
        drawnInstances: 2_720,
        geometries: 1,
        materials: 17
      },
      chunkMaterialBatches: {
        drawCalls: 272,
        drawnInstances: 2_720,
        rejectedInstances: 0,
        geometries: 1,
        materials: 17
      }
    });
    expect(measured.chunkMaterialBatches.drawCalls).toBeLessThanOrEqual(
      PERFORMANCE_BUDGETS.draft.metrics.calls.recommendedMaximum
    );
  });

  it("rejects off-screen instance work that a global batch would still draw", () => {
    const measured = measureChunkInstancingStrategies(chunks(4));

    expect(measured.globalMaterialBatches).toMatchObject({
      drawCalls: 17,
      drawnInstances: 2_720,
      rejectedInstances: 0
    });
    expect(measured.chunkMaterialBatches).toMatchObject({
      drawCalls: 68,
      drawnInstances: 680,
      rejectedInstances: 2_040
    });
  });

  it("bounds hostile workloads and sanitizes instance counts", () => {
    const workload = Array.from(
      { length: CHUNK_INSTANCING_BENCHMARK_LIMITS.maximumChunks + 1 },
      (_, index) => ({
        id: `chunk_${index}`,
        visible: false,
        blockInstances: {
          stone: Number.POSITIVE_INFINITY,
          dirt: -2,
          glass: 4.9
        }
      })
    );
    const measured = measureChunkInstancingStrategies(workload);

    expect(measured).toMatchObject({
      measuredChunks: CHUNK_INSTANCING_BENCHMARK_LIMITS.maximumChunks,
      overflowChunks: 1,
      visibleChunks: 0,
      totalInstances:
        CHUNK_INSTANCING_BENCHMARK_LIMITS.maximumChunks * 4,
      visibleInstances: 0
    });
  });
});
