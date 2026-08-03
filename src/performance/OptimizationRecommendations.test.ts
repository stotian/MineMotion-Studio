import { describe, expect, it } from "vitest";
import { EMPTY_RENDER_STATS } from "./RenderStats";
import { EMPTY_RENDERER_CULLING_SUMMARY } from "../renderer/RendererCulling";
import type { RendererMetricsSnapshot } from "./RendererMetrics";
import { PERFORMANCE_BUDGETS } from "./PerformanceBudgets";
import { createOptimizationRecommendationReport } from "./OptimizationRecommendations";

function snapshot(): RendererMetricsSnapshot {
  return {
    startupMs: 100,
    elapsedMs: 1_000,
    frame: {
      ...EMPTY_RENDER_STATS,
      fps: 60,
      bestFrameMs: 15,
      averageFrameMs: 16,
      p95FrameMs: 16.5,
      worstFrameMs: 18,
      samples: 120
    },
    renderer: {
      calls: 100,
      triangles: 100_000,
      points: 0,
      lines: 0,
      geometries: 100,
      textures: 20,
      programs: 5
    },
    heap: {
      usedBytes: 128 * 1024 * 1024,
      totalBytes: 256 * 1024 * 1024,
      limitBytes: 4_096 * 1024 * 1024
    },
    project: {
      sceneEntities: 3,
      visibleEntities: 3,
      sceneObjects: 1_000,
      importedChunks: 2,
      effects: 4,
      activeEffects: 3
    },
    culling: EMPTY_RENDERER_CULLING_SUMMARY
  };
}

describe("optimization recommendations", () => {
  it("returns no actions for a passing read-only diagnostic snapshot", () => {
    const report = createOptimizationRecommendationReport(snapshot(), "draft");
    expect(report.evaluation.status).toBe("pass");
    expect(report.recommendations).toEqual([]);
    expect(Object.isFrozen(report)).toBe(true);
  });

  it("prioritizes hard limits and caps the visible recommendation list", () => {
    const measured = snapshot();
    measured.renderer.calls =
      PERFORMANCE_BUDGETS.draft.metrics.calls.recommendedMaximum + 1;
    measured.renderer.triangles =
      PERFORMANCE_BUDGETS.draft.metrics.triangles.hardMaximum + 1;
    measured.project.activeEffects =
      PERFORMANCE_BUDGETS.draft.metrics.activeEffects.hardMaximum + 1;

    expect(
      createOptimizationRecommendationReport(measured, "draft", 2)
        .recommendations
    ).toEqual([
      expect.objectContaining({
        code: "reduce-visible-geometry",
        metric: "triangles",
        severity: "limit"
      }),
      expect.objectContaining({
        code: "mute-offscreen-effects",
        metric: "activeEffects",
        severity: "limit"
      })
    ]);
  });

  it("never emits a mutation callback or project patch", () => {
    const measured = snapshot();
    measured.heap = {
      ...measured.heap!,
      usedBytes:
        PERFORMANCE_BUDGETS.draft.metrics.heapUsedBytes.hardMaximum + 1
    };
    const [recommendation] = createOptimizationRecommendationReport(
      measured,
      "draft"
    ).recommendations;

    expect(recommendation).toEqual(expect.objectContaining({
      version: 1,
      code: "reopen-heavy-session"
    }));
    expect(recommendation).not.toHaveProperty("apply");
    expect(recommendation).not.toHaveProperty("patch");
  });
});
