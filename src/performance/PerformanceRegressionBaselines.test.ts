import { describe, expect, it } from "vitest";
import {
  PERFORMANCE_REGRESSION_BASELINE_VERSION,
  PHASE_20_MEASUREMENTS,
  PHASE_20_REGRESSION_THRESHOLDS
} from "./PerformanceRegressionBaselines";

describe("Phase 20 regression baselines", () => {
  it("records measured improvements rather than aspirational values", () => {
    expect(PERFORMANCE_REGRESSION_BASELINE_VERSION).toBe(1);
    expect(
      PHASE_20_MEASUREMENTS.bundle.afterSplitMainJavascriptBytes
    ).toBeLessThan(PHASE_20_MEASUREMENTS.bundle.beforeMainJavascriptBytes);
    expect(
      PHASE_20_MEASUREMENTS.architecture.appAfterProjectWorkspaceLines
    ).toBeLessThan(
      PHASE_20_MEASUREMENTS.architecture.appBeforeProjectWorkspaceLines
    );
    expect(
      PHASE_20_MEASUREMENTS.architecture.timelineAfterViewSplitLines
    ).toBeLessThan(
      PHASE_20_MEASUREMENTS.architecture.timelineBeforeViewSplitLines
    );
    expect(
      PHASE_20_MEASUREMENTS.vfxPool.afterMaterialAllocations
    ).toBeLessThan(
      PHASE_20_MEASUREMENTS.vfxPool.beforeMaterialAllocations
    );
  });

  it("keeps reviewed headroom bounded above the accepted measurements", () => {
    expect(PHASE_20_REGRESSION_THRESHOLDS.mainJavascriptBytes).toBeGreaterThan(
      PHASE_20_MEASUREMENTS.bundle.afterSplitMainJavascriptBytes
    );
    expect(PHASE_20_REGRESSION_THRESHOLDS.mainJavascriptBytes).toBeLessThan(
      PHASE_20_MEASUREMENTS.bundle.beforeMainJavascriptBytes
    );
    expect(PHASE_20_REGRESSION_THRESHOLDS.appLines).toBeGreaterThanOrEqual(
      PHASE_20_MEASUREMENTS.architecture.appAfterProjectWorkspaceLines
    );
    expect(PHASE_20_REGRESSION_THRESHOLDS.timelinePanelLines).toBeGreaterThanOrEqual(
      PHASE_20_MEASUREMENTS.architecture.timelineAfterViewSplitLines
    );
    expect(Object.isFrozen(PHASE_20_REGRESSION_THRESHOLDS)).toBe(true);
  });
});
