import type { RendererMetricsSnapshot } from "./RendererMetrics";

export const PERFORMANCE_BUDGET_VERSION = 1 as const;

export const PERFORMANCE_BUDGET_IDS = Object.freeze([
  "minimum",
  "recommended",
  "draft",
  "high",
  "final"
] as const);

export type PerformanceBudgetId = (typeof PERFORMANCE_BUDGET_IDS)[number];
export type PerformanceBudgetKind = "device" | "quality";
export type PerformanceBudgetStatus = "pass" | "recommendation" | "limit";

export type PerformanceBudgetMetric =
  | "startupMs"
  | "p95FrameMs"
  | "heapUsedBytes"
  | "calls"
  | "triangles"
  | "geometries"
  | "textures"
  | "sceneObjects"
  | "importedChunks"
  | "activeEffects";

export interface PerformanceMetricBudget {
  readonly recommendedMaximum: number;
  readonly hardMaximum: number;
}

export interface PerformanceBudget {
  readonly version: typeof PERFORMANCE_BUDGET_VERSION;
  readonly id: PerformanceBudgetId;
  readonly kind: PerformanceBudgetKind;
  readonly targetFps: number;
  readonly metrics: Readonly<
    Record<PerformanceBudgetMetric, PerformanceMetricBudget>
  >;
}

export interface PerformanceBudgetIssue {
  readonly metric: PerformanceBudgetMetric;
  readonly status: Exclude<PerformanceBudgetStatus, "pass">;
  readonly measured: number;
  readonly recommendedMaximum: number;
  readonly hardMaximum: number;
}

export interface PerformanceBudgetEvaluation {
  readonly budget: PerformanceBudget;
  readonly status: PerformanceBudgetStatus;
  readonly issues: readonly PerformanceBudgetIssue[];
  readonly unavailable: readonly PerformanceBudgetMetric[];
}

const MEBIBYTE = 1024 * 1024;
const MINIMUM_FRAME_SAMPLES = 30;

export const PERFORMANCE_BUDGETS: Readonly<
  Record<PerformanceBudgetId, PerformanceBudget>
> = Object.freeze({
  minimum: createBudget("minimum", "device", 30, {
    startupMs: threshold(5_000, 10_000),
    p95FrameMs: threshold(1000 / 30, 50),
    heapUsedBytes: threshold(384 * MEBIBYTE, 512 * MEBIBYTE),
    calls: threshold(500, 750),
    triangles: threshold(500_000, 750_000),
    geometries: threshold(2_000, 3_000),
    textures: threshold(256, 384),
    sceneObjects: threshold(25_000, 50_000),
    importedChunks: threshold(8, 16),
    activeEffects: threshold(12, 16)
  }),
  recommended: createBudget("recommended", "device", 60, {
    startupMs: threshold(3_000, 6_000),
    p95FrameMs: threshold(1000 / 60, 25),
    heapUsedBytes: threshold(768 * MEBIBYTE, 1_024 * MEBIBYTE),
    calls: threshold(1_000, 1_500),
    triangles: threshold(1_000_000, 1_500_000),
    geometries: threshold(5_000, 7_500),
    textures: threshold(512, 768),
    sceneObjects: threshold(75_000, 100_000),
    importedChunks: threshold(16, 32),
    activeEffects: threshold(24, 32)
  }),
  draft: createBudget("draft", "quality", 60, {
    startupMs: threshold(2_500, 5_000),
    p95FrameMs: threshold(1000 / 60, 25),
    heapUsedBytes: threshold(384 * MEBIBYTE, 512 * MEBIBYTE),
    calls: threshold(400, 600),
    triangles: threshold(350_000, 500_000),
    geometries: threshold(1_500, 2_500),
    textures: threshold(192, 256),
    sceneObjects: threshold(25_000, 50_000),
    importedChunks: threshold(8, 16),
    activeEffects: threshold(16, 24)
  }),
  high: createBudget("high", "quality", 30, {
    startupMs: threshold(4_000, 8_000),
    p95FrameMs: threshold(1000 / 30, 50),
    heapUsedBytes: threshold(1_024 * MEBIBYTE, 1_536 * MEBIBYTE),
    calls: threshold(1_200, 1_800),
    triangles: threshold(1_500_000, 2_500_000),
    geometries: threshold(7_500, 12_000),
    textures: threshold(768, 1_024),
    sceneObjects: threshold(100_000, 150_000),
    importedChunks: threshold(32, 64),
    activeEffects: threshold(32, 48)
  }),
  final: createBudget("final", "quality", 15, {
    startupMs: threshold(8_000, 15_000),
    p95FrameMs: threshold(1000 / 15, 100),
    heapUsedBytes: threshold(2_048 * MEBIBYTE, 3_072 * MEBIBYTE),
    calls: threshold(2_500, 4_000),
    triangles: threshold(4_000_000, 6_000_000),
    geometries: threshold(20_000, 30_000),
    textures: threshold(1_536, 2_048),
    sceneObjects: threshold(200_000, 300_000),
    importedChunks: threshold(64, 128),
    activeEffects: threshold(48, 64)
  })
});

const METRIC_ORDER: readonly PerformanceBudgetMetric[] = Object.freeze([
  "startupMs",
  "p95FrameMs",
  "heapUsedBytes",
  "calls",
  "triangles",
  "geometries",
  "textures",
  "sceneObjects",
  "importedChunks",
  "activeEffects"
]);

export function evaluatePerformanceBudget(
  snapshot: RendererMetricsSnapshot,
  budgetId: PerformanceBudgetId
): PerformanceBudgetEvaluation {
  const budget = PERFORMANCE_BUDGETS[budgetId];
  const unavailable: PerformanceBudgetMetric[] = [];
  const issues: PerformanceBudgetIssue[] = [];

  for (const metric of METRIC_ORDER) {
    const measured = readMetric(snapshot, metric);
    if (measured === null) {
      unavailable.push(metric);
      continue;
    }
    const bounds = budget.metrics[metric];
    const status =
      measured > bounds.hardMaximum
        ? "limit"
        : measured > bounds.recommendedMaximum
          ? "recommendation"
          : "pass";
    if (status !== "pass") {
      issues.push(Object.freeze({
        metric,
        status,
        measured,
        recommendedMaximum: bounds.recommendedMaximum,
        hardMaximum: bounds.hardMaximum
      }));
    }
  }

  return Object.freeze({
    budget,
    status: issues.some((issue) => issue.status === "limit")
      ? "limit"
      : issues.length > 0
        ? "recommendation"
        : "pass",
    issues: Object.freeze(issues),
    unavailable: Object.freeze(unavailable)
  });
}

function createBudget(
  id: PerformanceBudgetId,
  kind: PerformanceBudgetKind,
  targetFps: number,
  metrics: Record<PerformanceBudgetMetric, PerformanceMetricBudget>
): PerformanceBudget {
  for (const bounds of Object.values(metrics)) {
    if (
      !Number.isFinite(bounds.recommendedMaximum) ||
      !Number.isFinite(bounds.hardMaximum) ||
      bounds.recommendedMaximum < 0 ||
      bounds.hardMaximum < bounds.recommendedMaximum
    ) {
      throw new Error(`Invalid performance budget: ${id}`);
    }
  }
  return Object.freeze({
    version: PERFORMANCE_BUDGET_VERSION,
    id,
    kind,
    targetFps,
    metrics: Object.freeze(metrics)
  });
}

function threshold(
  recommendedMaximum: number,
  hardMaximum: number
): PerformanceMetricBudget {
  return Object.freeze({ recommendedMaximum, hardMaximum });
}

function readMetric(
  snapshot: RendererMetricsSnapshot,
  metric: PerformanceBudgetMetric
): number | null {
  switch (metric) {
    case "startupMs":
      return safeMeasurement(snapshot.startupMs);
    case "p95FrameMs":
      return snapshot.frame.samples >= MINIMUM_FRAME_SAMPLES
        ? safeMeasurement(snapshot.frame.p95FrameMs)
        : null;
    case "heapUsedBytes":
      return snapshot.heap
        ? safeMeasurement(snapshot.heap.usedBytes)
        : null;
    case "calls":
      return safeMeasurement(snapshot.renderer.calls);
    case "triangles":
      return safeMeasurement(snapshot.renderer.triangles);
    case "geometries":
      return safeMeasurement(snapshot.renderer.geometries);
    case "textures":
      return safeMeasurement(snapshot.renderer.textures);
    case "sceneObjects":
      return safeMeasurement(snapshot.project.sceneObjects);
    case "importedChunks":
      return safeMeasurement(snapshot.project.importedChunks);
    case "activeEffects":
      return safeMeasurement(snapshot.project.activeEffects);
  }
}

function safeMeasurement(value: number): number | null {
  return Number.isFinite(value) && value >= 0 ? value : null;
}
