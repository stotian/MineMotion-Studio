import thresholds from "./performance-regression-thresholds.json";

export const PERFORMANCE_REGRESSION_BASELINE_VERSION = 2 as const;

export const MILESTONE_2_MEASUREMENTS = Object.freeze({
  bundle: Object.freeze({
    beforeMainJavascriptBytes: 2_645_129,
    afterSplitMainJavascriptBytes: 1_812_316,
    afterSplitMainGzipBytes: 346_600,
    afterSplitDeferredJavascriptBytes: 878_527,
    workerJavascriptBytes: 11_441
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

export const MILESTONE_2_REGRESSION_THRESHOLDS = Object.freeze({
  ...thresholds
});
