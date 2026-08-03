import { generateCrowdPrototype } from "./CrowdGenerator";
export interface CrowdBenchmarkSample { count: number; generated: number; generationMs: number; estimatedCpuBytes: number; estimatedGpuBytes: number; }
export function runCrowdPrototypeBenchmark(counts: readonly number[] = [10, 25, 50, 80]): CrowdBenchmarkSample[] {
  return counts.map((count) => {
    const result = generateCrowdPrototype({ count, radius: Math.max(8, Math.sqrt(count) * 3), seed: 2501 + count, center: [0, 1.05, 0], spacing: 1.2 });
    return { count, generated: result.metrics.generated, generationMs: result.metrics.generationMs, estimatedCpuBytes: result.metrics.estimatedCpuBytes, estimatedGpuBytes: result.metrics.estimatedGpuBytes };
  });
}
