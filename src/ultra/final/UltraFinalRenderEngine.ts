export interface UltraRenderQualityProfile {
  width: number;
  height: number;
  startFrame: number;
  endFrame: number;
  samples: number;
  adaptiveThreshold: number;
  tileSize: number;
  workerCount: number;
  seed: number;
}

export interface UltraRenderTile {
  id: string;
  frame: number;
  x: number;
  y: number;
  width: number;
  height: number;
  samples: number;
  priority: number;
}

export interface UltraRenderCheckpoint {
  planFingerprint: string;
  completedTileIds: string[];
  nextTileId: string | null;
  createdAt: string;
}

export function normalizeRenderQuality(profile: UltraRenderQualityProfile): UltraRenderQualityProfile {
  return {
    width: clampInt(profile.width, 16, 16_384),
    height: clampInt(profile.height, 16, 16_384),
    startFrame: clampInt(profile.startFrame, 0, 10_000_000),
    endFrame: clampInt(Math.max(profile.endFrame, profile.startFrame), 0, 10_000_000),
    samples: clampInt(profile.samples, 1, 65_536),
    adaptiveThreshold: clamp(profile.adaptiveThreshold, 0, 1),
    tileSize: clampInt(profile.tileSize, 16, 2048),
    workerCount: clampInt(profile.workerCount, 1, 1024),
    seed: profile.seed | 0
  };
}

export function createOfflineRenderPlan(profile: UltraRenderQualityProfile): UltraRenderTile[] {
  const safe = normalizeRenderQuality(profile);
  const tiles: UltraRenderTile[] = [];
  for (let frame = safe.startFrame; frame <= safe.endFrame; frame += 1) {
    for (let y = 0; y < safe.height; y += safe.tileSize) {
      for (let x = 0; x < safe.width; x += safe.tileSize) {
        const noiseHint = deterministic01(safe.seed, frame, x, y);
        tiles.push({
          id: `f${frame}:x${x}:y${y}`,
          frame,
          x,
          y,
          width: Math.min(safe.tileSize, safe.width - x),
          height: Math.min(safe.tileSize, safe.height - y),
          samples: resolveAdaptiveSamples(safe.samples, safe.adaptiveThreshold, noiseHint),
          priority: Math.round((1 - noiseHint) * 10_000)
        });
      }
    }
  }
  return tiles.sort((a, b) => a.frame - b.frame || b.priority - a.priority || a.y - b.y || a.x - b.x);
}

export function createSampleSequence(sampleCount: number, seed: number): number[] {
  const count = clampInt(sampleCount, 1, 65_536);
  return Array.from({ length: count }, (_, index) => deterministic01(seed, index, count, 86));
}

export function resolveAdaptiveSamples(maxSamples: number, threshold: number, noiseEstimate: number): number {
  const maximum = clampInt(maxSamples, 1, 65_536);
  const safeThreshold = clamp(threshold, 0, 1);
  const noise = clamp(noiseEstimate, 0, 1);
  const minimumRatio = Math.max(0.05, 1 - safeThreshold * 0.95);
  return clampInt(Math.ceil(maximum * Math.max(minimumRatio, noise)), 1, maximum);
}

export function createRenderCheckpoint(
  plan: readonly UltraRenderTile[],
  completedTileIds: readonly string[],
  createdAt = new Date().toISOString()
): UltraRenderCheckpoint {
  const known = new Set(plan.map((tile) => tile.id));
  const completed = [...new Set(completedTileIds.filter((id) => known.has(id)))].sort();
  const completedSet = new Set(completed);
  return {
    planFingerprint: fingerprint(plan.map(({ id, samples }) => [id, samples])),
    completedTileIds: completed,
    nextTileId: plan.find((tile) => !completedSet.has(tile.id))?.id ?? null,
    createdAt
  };
}

export function resumeRenderPlan(plan: readonly UltraRenderTile[], checkpoint: UltraRenderCheckpoint): UltraRenderTile[] {
  if (checkpoint.planFingerprint !== fingerprint(plan.map(({ id, samples }) => [id, samples]))) {
    throw new Error("RENDER_CHECKPOINT_PLAN_MISMATCH");
  }
  const completed = new Set(checkpoint.completedTileIds);
  return plan.filter((tile) => !completed.has(tile.id));
}

export function createDenoisePlan(passes: readonly string[], temporal: boolean): string[] {
  const required = new Set(["beauty", "albedo", "normal", ...passes]);
  if (temporal) required.add("motionVector");
  return [...required].sort();
}

export function sampleMotionBlurSegments(shutterAngle: number, segments: number): number[] {
  const count = clampInt(segments, 1, 64);
  const exposure = clamp(shutterAngle, 0, 360) / 360;
  return Array.from({ length: count }, (_, index) => ((index + 0.5) / count - 0.5) * exposure);
}

export function createBokehKernel(blades: number, rotationDegrees: number): Array<readonly [number, number]> {
  const count = clampInt(blades, 3, 32);
  const rotation = rotationDegrees * Math.PI / 180;
  return Array.from({ length: count }, (_, index) => {
    const angle = rotation + index / count * Math.PI * 2;
    return [canonical(Math.cos(angle)), canonical(Math.sin(angle))] as const;
  });
}

export function createObjectMaskManifest(objectIds: readonly string[]): Record<string, number> {
  return Object.fromEntries([...new Set(objectIds.filter(Boolean))].sort().map((id, index) => [id, index + 1]));
}

export function createAovManifest(customPasses: readonly string[]): string[] {
  return [...new Set(["beauty", "depth", "normal", "motionVector", "objectId", ...customPasses.filter(Boolean)])].sort();
}

export function distributeRenderTiles(plan: readonly UltraRenderTile[], workerCount: number): UltraRenderTile[][] {
  const count = clampInt(workerCount, 1, Math.max(1, plan.length));
  const workers = Array.from({ length: count }, () => [] as UltraRenderTile[]);
  plan.forEach((tile, index) => workers[index % count].push(tile));
  return workers;
}

export function estimateRenderMemoryMb(profile: UltraRenderQualityProfile, passCount: number): number {
  const safe = normalizeRenderQuality(profile);
  const passes = clampInt(passCount, 1, 64);
  return Math.ceil(safe.width * safe.height * passes * 16 / (1024 * 1024));
}

function deterministic01(seed: number, a: number, b: number, c: number): number {
  let value = (seed ^ Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 7, 0x85ebca6b) ^ Math.imul(c + 13, 0xc2b2ae35)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return ((value ^ (value >>> 16)) >>> 0) / 0xffffffff;
}

function fingerprint(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function canonical(value: number): number { return Math.round(value * 1e8) / 1e8; }
function clampInt(value: number, minimum: number, maximum: number): number { return Math.round(clamp(value, minimum, maximum)); }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum)); }
