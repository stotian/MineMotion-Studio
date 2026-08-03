import {
  evaluatePerformanceBudget,
  type PerformanceBudgetEvaluation,
  type PerformanceBudgetId,
  type PerformanceBudgetIssue,
  type PerformanceBudgetMetric
} from "./PerformanceBudgets";
import type { RendererMetricsSnapshot } from "./RendererMetrics";

export const OPTIMIZATION_RECOMMENDATION_VERSION = 1 as const;

export type OptimizationRecommendationCode =
  | "reduce-startup-load"
  | "switch-playback-to-draft"
  | "reopen-heavy-session"
  | "reduce-render-calls"
  | "reduce-visible-geometry"
  | "unload-unused-assets"
  | "reduce-loaded-textures"
  | "hide-inactive-scene-groups"
  | "reduce-world-radius"
  | "mute-offscreen-effects";

export interface OptimizationRecommendation {
  readonly version: typeof OPTIMIZATION_RECOMMENDATION_VERSION;
  readonly code: OptimizationRecommendationCode;
  readonly metric: PerformanceBudgetMetric;
  readonly severity: PerformanceBudgetIssue["status"];
  readonly measured: number;
  readonly recommendedMaximum: number;
  readonly hardMaximum: number;
}

export interface OptimizationRecommendationReport {
  readonly evaluation: PerformanceBudgetEvaluation;
  readonly recommendations: readonly OptimizationRecommendation[];
}

const RECOMMENDATION_BY_METRIC: Readonly<
  Record<PerformanceBudgetMetric, OptimizationRecommendationCode>
> = Object.freeze({
  startupMs: "reduce-startup-load",
  p95FrameMs: "switch-playback-to-draft",
  heapUsedBytes: "reopen-heavy-session",
  calls: "reduce-render-calls",
  triangles: "reduce-visible-geometry",
  geometries: "unload-unused-assets",
  textures: "reduce-loaded-textures",
  sceneObjects: "hide-inactive-scene-groups",
  importedChunks: "reduce-world-radius",
  activeEffects: "mute-offscreen-effects"
});

export function createOptimizationRecommendationReport(
  snapshot: RendererMetricsSnapshot,
  budgetId: PerformanceBudgetId,
  maximumRecommendations = 3
): OptimizationRecommendationReport {
  const evaluation = evaluatePerformanceBudget(snapshot, budgetId);
  const limit = Math.max(0, Math.floor(maximumRecommendations));
  const recommendations = [...evaluation.issues]
    .sort((left, right) => severityRank(right.status) - severityRank(left.status))
    .slice(0, limit)
    .map((issue) => Object.freeze({
      version: OPTIMIZATION_RECOMMENDATION_VERSION,
      code: RECOMMENDATION_BY_METRIC[issue.metric],
      metric: issue.metric,
      severity: issue.status,
      measured: issue.measured,
      recommendedMaximum: issue.recommendedMaximum,
      hardMaximum: issue.hardMaximum
    }));

  return Object.freeze({
    evaluation,
    recommendations: Object.freeze(recommendations)
  });
}

function severityRank(status: PerformanceBudgetIssue["status"]): number {
  return status === "limit" ? 2 : 1;
}
