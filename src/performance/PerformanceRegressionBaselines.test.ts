import { describe, expect, it } from "vitest";
import {
  PERFORMANCE_REGRESSION_BASELINE_VERSION,
  MILESTONE_2_MEASUREMENTS,
  MILESTONE_2_REGRESSION_THRESHOLDS
} from "./PerformanceRegressionBaselines";

describe("Milestone 2 regression baselines", () => {
  it("records measured improvements rather than aspirational values", () => {
    expect(PERFORMANCE_REGRESSION_BASELINE_VERSION).toBe(2);
    expect(
      MILESTONE_2_MEASUREMENTS.bundle.afterSplitMainJavascriptBytes
    ).toBeLessThan(MILESTONE_2_MEASUREMENTS.bundle.beforeMainJavascriptBytes);
    expect(
      MILESTONE_2_MEASUREMENTS.architecture.appAfterProjectWorkspaceLines
    ).toBeLessThan(
      MILESTONE_2_MEASUREMENTS.architecture.appBeforeProjectWorkspaceLines
    );
    expect(
      MILESTONE_2_MEASUREMENTS.architecture.timelineAfterViewSplitLines
    ).toBeLessThan(
      MILESTONE_2_MEASUREMENTS.architecture.timelineBeforeViewSplitLines
    );
    expect(
      MILESTONE_2_MEASUREMENTS.vfxPool.afterMaterialAllocations
    ).toBeLessThan(
      MILESTONE_2_MEASUREMENTS.vfxPool.beforeMaterialAllocations
    );
  });

  it("keeps reviewed headroom bounded above the accepted measurements", () => {
    expect(MILESTONE_2_REGRESSION_THRESHOLDS.mainJavascriptBytes).toBeGreaterThan(
      MILESTONE_2_MEASUREMENTS.bundle.afterSplitMainJavascriptBytes
    );
    expect(MILESTONE_2_REGRESSION_THRESHOLDS.mainJavascriptBytes).toBeLessThan(
      MILESTONE_2_MEASUREMENTS.bundle.beforeMainJavascriptBytes
    );
    expect(MILESTONE_2_REGRESSION_THRESHOLDS.appLines).toBeGreaterThanOrEqual(
      MILESTONE_2_MEASUREMENTS.architecture.appAfterProjectWorkspaceLines
    );
    expect(MILESTONE_2_REGRESSION_THRESHOLDS.timelinePanelLines).toBeGreaterThanOrEqual(
      MILESTONE_2_MEASUREMENTS.architecture.timelineAfterViewSplitLines
    );
    expect(Object.isFrozen(MILESTONE_2_REGRESSION_THRESHOLDS)).toBe(true);
  });
});
