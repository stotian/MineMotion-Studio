import thresholds from "./performance-regression-thresholds.json";

export const PERFORMANCE_REGRESSION_BASELINE_VERSION = 1 as const;

export const PHASE_20_MEASUREMENTS = Object.freeze({
  bundle: Object.freeze({
    beforeMainJavascriptBytes: 1_542_640,
    afterSplitMainJavascriptBytes: 1_439_600,
    afterSplitMainGzipBytes: 397_660,
    afterSplitDeferredJavascriptBytes: 110_640,
    workerJavascriptBytes: 7_610
  }),
  architecture: Object.freeze({
    appBeforeProjectWorkspaceLines: 2_014,
    appAfterProjectWorkspaceLines: 1_855,
    timelineBeforeViewSplitLines: 1_411,
    timelineAfterViewSplitLines: 973
  }),
  vfxPool: Object.freeze({
    beforeGeometryAllocations: 15_360,
    afterGeometryAllocations: 5_762,
    beforeMaterialAllocations: 15_360,
    afterMaterialAllocations: 128,
    beforeParticleBufferAllocations: 7_680,
    afterParticleBufferAllocations: 64
  })
});

export const PHASE_20_REGRESSION_THRESHOLDS = Object.freeze({
  ...thresholds
});
