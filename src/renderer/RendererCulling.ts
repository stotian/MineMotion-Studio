import type { ThreeSceneLayerId } from "./RendererLayers";

export const RENDERER_CULLING_LIMITS = Object.freeze({
  maximumEntries: 4_096,
  maximumCoordinate: 30_000_000,
  maximumRadius: 30_000_000
});

export type CullingVector3 = readonly [number, number, number];
export type CullingPlane = readonly [number, number, number, number];
export type RendererCullingReason =
  | "visible"
  | "selected"
  | "layer"
  | "distance"
  | "frustum"
  | "invalid";

export interface RendererCullingEntry {
  readonly id: string;
  readonly selectionId?: string;
  readonly layer: ThreeSceneLayerId;
  readonly center: CullingVector3;
  readonly radius: number;
  readonly chunk?: readonly [number, number];
}

export interface RendererCullingInput {
  readonly cameraPosition: CullingVector3;
  readonly maximumDistance: number;
  readonly frustumPlanes: readonly CullingPlane[];
  readonly enabledLayers: ReadonlySet<ThreeSceneLayerId>;
  readonly selectedId: string | null;
  readonly allowSelectedOverride: boolean;
}

export interface RendererCullingDecision {
  readonly id: string;
  readonly visible: boolean;
  readonly reason: RendererCullingReason;
}

export interface RendererCullingSummary {
  readonly tested: number;
  readonly visible: number;
  readonly layerCulled: number;
  readonly distanceCulled: number;
  readonly frustumCulled: number;
  readonly selectedOverrides: number;
  readonly invalid: number;
  readonly unmeasured: number;
  readonly chunksTested: number;
  readonly chunksVisible: number;
}

export interface RendererCullingEvaluation {
  readonly decisions: readonly RendererCullingDecision[];
  readonly summary: RendererCullingSummary;
}

export const EMPTY_RENDERER_CULLING_SUMMARY: RendererCullingSummary =
  Object.freeze({
    tested: 0,
    visible: 0,
    layerCulled: 0,
    distanceCulled: 0,
    frustumCulled: 0,
    selectedOverrides: 0,
    invalid: 0,
    unmeasured: 0,
    chunksTested: 0,
    chunksVisible: 0
  });

export function evaluateRendererCulling(
  entries: readonly RendererCullingEntry[],
  input: RendererCullingInput
): RendererCullingEvaluation {
  const measuredEntries = entries.slice(
    0,
    RENDERER_CULLING_LIMITS.maximumEntries
  );
  const mutable = {
    ...EMPTY_RENDERER_CULLING_SUMMARY,
    unmeasured: Math.max(0, entries.length - measuredEntries.length)
  };
  const decisions = measuredEntries.map((entry) => {
    const reason = evaluateEntry(entry, input);
    const visible =
      reason === "visible" ||
      reason === "selected" ||
      reason === "invalid";
    mutable.tested += 1;
    if (visible) mutable.visible += 1;
    if (reason === "layer") mutable.layerCulled += 1;
    if (reason === "distance") mutable.distanceCulled += 1;
    if (reason === "frustum") mutable.frustumCulled += 1;
    if (reason === "selected") mutable.selectedOverrides += 1;
    if (reason === "invalid") mutable.invalid += 1;
    if (entry.chunk) {
      mutable.chunksTested += 1;
      if (visible) mutable.chunksVisible += 1;
    }
    return Object.freeze({ id: entry.id, visible, reason });
  });

  return Object.freeze({
    decisions: Object.freeze(decisions),
    summary: Object.freeze(mutable)
  });
}

function evaluateEntry(
  entry: RendererCullingEntry,
  input: RendererCullingInput
): RendererCullingReason {
  if (!validEntry(entry) || !validInput(input)) return "invalid";
  if (!input.enabledLayers.has(entry.layer)) return "layer";
  if (
    input.allowSelectedOverride &&
    input.selectedId !== null &&
    (entry.selectionId ?? entry.id) === input.selectedId
  ) {
    return "selected";
  }
  if (
    distance(input.cameraPosition, entry.center) - entry.radius >
    input.maximumDistance
  ) {
    return "distance";
  }
  for (const plane of input.frustumPlanes) {
    if (signedDistance(plane, entry.center) < -entry.radius) {
      return "frustum";
    }
  }
  return "visible";
}

function validEntry(entry: RendererCullingEntry): boolean {
  return entry.id.length > 0 &&
    boundedVector(entry.center) &&
    Number.isFinite(entry.radius) &&
    entry.radius >= 0 &&
    entry.radius <= RENDERER_CULLING_LIMITS.maximumRadius;
}

function validInput(input: RendererCullingInput): boolean {
  return boundedVector(input.cameraPosition) &&
    Number.isFinite(input.maximumDistance) &&
    input.maximumDistance >= 0 &&
    input.frustumPlanes.length === 6 &&
    input.frustumPlanes.every((plane) =>
      plane.length === 4 &&
      plane.every((value) => Number.isFinite(value))
    );
}

function boundedVector(value: readonly number[]): value is CullingVector3 {
  return value.length === 3 &&
    value.every((component) =>
      Number.isFinite(component) &&
      Math.abs(component) <= RENDERER_CULLING_LIMITS.maximumCoordinate
    );
}

function distance(left: CullingVector3, right: CullingVector3): number {
  return Math.hypot(
    left[0] - right[0],
    left[1] - right[1],
    left[2] - right[2]
  );
}

function signedDistance(plane: CullingPlane, point: CullingVector3): number {
  return plane[0] * point[0] +
    plane[1] * point[1] +
    plane[2] * point[2] +
    plane[3];
}
