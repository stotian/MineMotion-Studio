export const CHUNK_INSTANCING_BENCHMARK_LIMITS = Object.freeze({
  maximumChunks: 4_096,
  maximumBlockKinds: 64,
  maximumInstancesPerKind: 1_000_000
});

export interface ChunkInstancingWorkload {
  readonly id: string;
  readonly visible: boolean;
  readonly blockInstances: Readonly<Record<string, number>>;
}

export interface InstancingStrategyMeasurement {
  readonly drawCalls: number;
  readonly drawnInstances: number;
  readonly rejectedInstances: number;
  readonly geometries: number;
  readonly materials: number;
}

export interface ChunkInstancingMeasurement {
  readonly measuredChunks: number;
  readonly overflowChunks: number;
  readonly visibleChunks: number;
  readonly nonEmptyChunks: number;
  readonly totalInstances: number;
  readonly visibleInstances: number;
  readonly globalMaterialBatches: InstancingStrategyMeasurement;
  readonly chunkMaterialBatches: InstancingStrategyMeasurement;
  readonly sharedGeometrySavings: number;
}

export function measureChunkInstancingStrategies(
  workload: readonly ChunkInstancingWorkload[]
): ChunkInstancingMeasurement {
  const chunks = workload.slice(
    0,
    CHUNK_INSTANCING_BENCHMARK_LIMITS.maximumChunks
  );
  const globalKinds = new Set<string>();
  let visibleChunks = 0;
  let nonEmptyChunks = 0;
  let totalInstances = 0;
  let visibleInstances = 0;
  let chunkDrawCalls = 0;

  for (const chunk of chunks) {
    const entries = sanitizeBlockInstances(chunk.blockInstances);
    const instances = entries.reduce((sum, [, count]) => sum + count, 0);
    if (instances > 0) nonEmptyChunks += 1;
    totalInstances += instances;
    for (const [kind] of entries) globalKinds.add(kind);
    if (!chunk.visible) continue;
    visibleChunks += 1;
    visibleInstances += instances;
    chunkDrawCalls += entries.length;
  }

  const anyVisible = visibleChunks > 0;
  const geometries = nonEmptyChunks > 0 ? 1 : 0;
  return Object.freeze({
    measuredChunks: chunks.length,
    overflowChunks: Math.max(0, workload.length - chunks.length),
    visibleChunks,
    nonEmptyChunks,
    totalInstances,
    visibleInstances,
    globalMaterialBatches: freezeStrategy({
      drawCalls: anyVisible ? globalKinds.size : 0,
      drawnInstances: anyVisible ? totalInstances : 0,
      rejectedInstances: 0,
      geometries,
      materials: globalKinds.size
    }),
    chunkMaterialBatches: freezeStrategy({
      drawCalls: chunkDrawCalls,
      drawnInstances: visibleInstances,
      rejectedInstances: totalInstances - visibleInstances,
      geometries,
      materials: globalKinds.size
    }),
    sharedGeometrySavings: Math.max(0, nonEmptyChunks - geometries)
  });
}

function sanitizeBlockInstances(
  value: Readonly<Record<string, number>>
): Array<readonly [string, number]> {
  return Object.entries(value)
    .filter(([kind, count]) =>
      kind.length > 0 &&
      kind.length <= 128 &&
      Number.isFinite(count) &&
      count > 0
    )
    .slice(0, CHUNK_INSTANCING_BENCHMARK_LIMITS.maximumBlockKinds)
    .map(([kind, count]) => [
      kind,
      Math.min(
        CHUNK_INSTANCING_BENCHMARK_LIMITS.maximumInstancesPerKind,
        Math.floor(count)
      )
    ] as const);
}

function freezeStrategy(
  value: InstancingStrategyMeasurement
): InstancingStrategyMeasurement {
  return Object.freeze(value);
}
