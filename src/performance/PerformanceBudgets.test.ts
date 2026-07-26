import { describe, expect, it } from "vitest";
import { EMPTY_RENDER_STATS } from "./RenderStats";
import type { RendererMetricsSnapshot } from "./RendererMetrics";
import { EMPTY_RENDERER_CULLING_SUMMARY } from "../renderer/RendererCulling";
import {
  evaluatePerformanceBudget,
  PERFORMANCE_BUDGET_IDS,
  PERFORMANCE_BUDGETS
} from "./PerformanceBudgets";

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

describe("performance budgets", () => {
  it("defines five immutable versioned budgets with valid thresholds", () => {
    expect(PERFORMANCE_BUDGET_IDS).toEqual([
      "minimum",
      "recommended",
      "draft",
      "high",
      "final"
    ]);
    for (const id of PERFORMANCE_BUDGET_IDS) {
      const budget = PERFORMANCE_BUDGETS[id];
      expect(budget).toMatchObject({ version: 1, id });
      expect(Object.isFrozen(budget)).toBe(true);
      expect(Object.isFrozen(budget.metrics)).toBe(true);
      for (const bounds of Object.values(budget.metrics)) {
        expect(Object.isFrozen(bounds)).toBe(true);
        expect(bounds.recommendedMaximum).toBeLessThanOrEqual(
          bounds.hardMaximum
        );
      }
    }
  });

  it("reports recommendations and hard limits in stable metric order", () => {
    const measured = snapshot();
    measured.renderer.calls =
      PERFORMANCE_BUDGETS.draft.metrics.calls.recommendedMaximum + 1;
    measured.renderer.triangles =
      PERFORMANCE_BUDGETS.draft.metrics.triangles.hardMaximum + 1;

    expect(evaluatePerformanceBudget(measured, "draft")).toMatchObject({
      budget: { id: "draft" },
      status: "limit",
      issues: [
        { metric: "calls", status: "recommendation" },
        { metric: "triangles", status: "limit" }
      ],
      unavailable: []
    });
  });

  it("does not classify unavailable heap or an unprimed frame window", () => {
    const measured = snapshot();
    measured.heap = null;
    measured.frame.samples = 29;
    measured.renderer.calls = Number.POSITIVE_INFINITY;
    measured.frame.p95FrameMs =
      PERFORMANCE_BUDGETS.minimum.metrics.p95FrameMs.hardMaximum + 1;

    expect(evaluatePerformanceBudget(measured, "minimum")).toMatchObject({
      status: "pass",
      issues: [],
      unavailable: ["p95FrameMs", "heapUsedBytes", "calls"]
    });
  });

  it("treats exact hard boundaries as passing the hard limit", () => {
    const measured = snapshot();
    measured.project.activeEffects =
      PERFORMANCE_BUDGETS.minimum.metrics.activeEffects.hardMaximum;

    const result = evaluatePerformanceBudget(measured, "minimum");
    expect(result.status).toBe("recommendation");
    expect(result.issues).toEqual([
      expect.objectContaining({
        metric: "activeEffects",
        status: "recommendation"
      })
    ]);
  });
});
