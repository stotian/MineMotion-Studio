import type { NlaClipInstance } from "../../project/ProjectFile";
import { createDeterministicId } from "../../core/ids/Id";
import type {
  AnimationLayerBlendMode,
  AnimationLayerKind
} from "./AnimationLayerTypes";

export const ANIMATION_LAYER_VERSION = 1 as const;

export type {
  AnimationLayerBlendMode,
  AnimationLayerKind
} from "./AnimationLayerTypes";

export interface AnimationLayerData {
  version: typeof ANIMATION_LAYER_VERSION;
  id: string;
  targetId: string;
  kind: AnimationLayerKind;
  blendMode: AnimationLayerBlendMode;
  weight: number;
  muted: boolean;
  clips: NlaClipInstance[];
  vfxEffectIds: string[];
}

export const ANIMATION_LAYER_KINDS: readonly AnimationLayerKind[] = Object.freeze([
  "base",
  "upperBody",
  "headLook",
  "handAdjustment",
  "additiveMotion",
  "vfxSync"
]);

export const ANIMATION_LAYER_LIMITS = Object.freeze({
  layers: ANIMATION_LAYER_KINDS.length,
  clipsPerLayer: 32,
  effectIds: 64,
  frame: 10_000_000,
  durationFrames: 1_000_000,
  timeScale: 100
});

const KINDS = new Set<AnimationLayerKind>(ANIMATION_LAYER_KINDS);
const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

export function createAnimationLayer(
  targetId: string,
  kind: AnimationLayerKind
): AnimationLayerData {
  return {
    version: ANIMATION_LAYER_VERSION,
    id: createDeterministicId("layer", `${targetId}:${kind}`),
    targetId,
    kind,
    blendMode: blendModeForKind(kind),
    weight: 1,
    muted: false,
    clips: [],
    vfxEffectIds: []
  };
}

export function sanitizeAnimationLayers(value: unknown): AnimationLayerData[] {
  try {
    if (!Array.isArray(value)) return [];
    const layerKeys = new Set<string>();
    const output: AnimationLayerData[] = [];
    for (const candidate of value.slice(0, ANIMATION_LAYER_LIMITS.layers)) {
      const record = ownDataRecord(candidate);
      const layerKey = `${String(record?.targetId)}:${String(record?.kind)}`;
      if (!record ||
        record.version !== ANIMATION_LAYER_VERSION ||
        !KINDS.has(record.kind as AnimationLayerKind) ||
        !safeId(record.id) ||
        !safeId(record.targetId) ||
        layerKeys.has(layerKey)) {
        continue;
      }
      const kind = record.kind as AnimationLayerKind;
      const clips = sanitizeClips(record.clips, record.targetId);
      const vfxEffectIds = sanitizeIds(record.vfxEffectIds, ANIMATION_LAYER_LIMITS.effectIds);
      layerKeys.add(layerKey);
      output.push({
        version: ANIMATION_LAYER_VERSION,
        id: record.id,
        targetId: record.targetId,
        kind,
        blendMode: blendModeForKind(kind),
        weight: clampNumber(record.weight, 0, 1, 1),
        muted: record.muted === true,
        clips,
        vfxEffectIds: kind === "vfxSync" ? vfxEffectIds : []
      });
    }
    return output.sort((left, right) =>
      left.targetId.localeCompare(right.targetId) ||
      ANIMATION_LAYER_KINDS.indexOf(left.kind) -
      ANIMATION_LAYER_KINDS.indexOf(right.kind)
    );
  } catch {
    return [];
  }
}

function sanitizeClips(value: unknown, targetId: unknown): NlaClipInstance[] {
  try {
    if (!Array.isArray(value) || typeof targetId !== "string") return [];
    return value.slice(0, ANIMATION_LAYER_LIMITS.clipsPerLayer).flatMap((candidate) => {
      const clip = ownDataRecord(candidate);
      if (!clip || !safeId(clip.id) || !safeId(clip.clipId) ||
        clip.targetId !== targetId) {
        return [];
      }
      return [{
        id: clip.id,
        clipId: clip.clipId,
        targetId,
        startFrame: clampInteger(
          clip.startFrame,
          0,
          ANIMATION_LAYER_LIMITS.frame,
          0
        ),
        durationFrames: clampInteger(
          clip.durationFrames,
          1,
          ANIMATION_LAYER_LIMITS.durationFrames,
          1
        ),
        timeScale: clampNumber(
          clip.timeScale,
          0.01,
          ANIMATION_LAYER_LIMITS.timeScale,
          1
        ),
        weight: clampNumber(clip.weight, 0, 1, 1),
        muted: clip.muted === true
      }];
    });
  } catch {
    return [];
  }
}

function sanitizeIds(value: unknown, limit: number): string[] {
  try {
    if (!Array.isArray(value)) return [];
    const ids = value.slice(0, limit).filter(safeId);
    return [...new Set(ids)];
  } catch {
    return [];
  }
}

function blendModeForKind(kind: AnimationLayerKind): AnimationLayerBlendMode {
  if (kind === "additiveMotion") return "additive";
  if (kind === "vfxSync") return "metadata";
  return "override";
}

function safeId(value: unknown): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

function clampNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

function clampInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, Math.round(value)))
    : fallback;
}

function ownDataRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.values(descriptors).some((descriptor) => !("value" in descriptor))) {
      return null;
    }
    return Object.fromEntries(
      Object.entries(descriptors).map(([key, descriptor]) => [key, descriptor.value])
    );
  } catch {
    return null;
  }
}
