import type { ExportRenderPass } from "../export/ExportTypes";

export interface CompositingBenchmarkCase {
  id: string;
  width: number;
  height: number;
  passes: ExportRenderPass[];
  postOperations: number;
  maximumFrameTimeMs: number;
}

export const COMPOSITING_BENCHMARKS: readonly CompositingBenchmarkCase[] = Object.freeze([
  { id: "preview-1080p", width: 1920, height: 1080, passes: ["beauty"], postOperations: 7, maximumFrameTimeMs: 33.4 },
  { id: "multilayer-1080p", width: 1920, height: 1080, passes: ["beauty", "alpha", "world", "characters", "vfx"], postOperations: 7, maximumFrameTimeMs: 50 },
  { id: "data-passes-1080p", width: 1920, height: 1080, passes: ["depth", "normals", "object-id"], postOperations: 0, maximumFrameTimeMs: 40 },
  { id: "final-4k", width: 3840, height: 2160, passes: ["beauty"], postOperations: 7, maximumFrameTimeMs: 120 }
]);

export function validateCompositingBenchmark(caseData: CompositingBenchmarkCase, measuredFrameTimeMs: number): { pass: boolean; ratio: number } {
  const ratio = measuredFrameTimeMs / caseData.maximumFrameTimeMs;
  return { pass: Number.isFinite(ratio) && ratio <= 1, ratio };
}
