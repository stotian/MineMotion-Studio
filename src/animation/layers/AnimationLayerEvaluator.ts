import { lerpVector3, sampleVectorTrack } from "../Interpolation";
import type {
  AnimatableProperty,
  ReusableAnimationClip,
  Vector3Tuple
} from "../../project/ProjectFile";
import type { RigVector3Tuple } from "../../rigs/RigTypes";
import {
  sanitizeAnimationLayers,
  ANIMATION_LAYER_LIMITS,
  type AnimationLayerKind
} from "./AnimationLayer";

export interface AnimationLayerEvaluation {
  values: Readonly<Record<string, RigVector3Tuple>>;
  activeLayerIds: readonly string[];
  vfxEffectIds: readonly string[];
  warnings: readonly string[];
}

const UPPER_BODY_BONES = new Set([
  "body",
  "cape",
  "head",
  "leftArm",
  "leftForearm",
  "rightArm",
  "rightForearm"
]);
const HAND_BONES = new Set([
  "leftArm",
  "leftForearm",
  "rightArm",
  "rightForearm"
]);

export function evaluateAnimationLayers(
  layers: unknown,
  clips: readonly ReusableAnimationClip[],
  baseValues: Readonly<Record<string, Vector3Tuple>>,
  frame: number
): AnimationLayerEvaluation {
  if (!Number.isFinite(frame) || frame < 0 ||
    frame > ANIMATION_LAYER_LIMITS.frame) {
    return {
      values: cloneValues(baseValues),
      activeLayerIds: [],
      vfxEffectIds: [],
      warnings: ["ANIMATION_LAYER_FRAME_INVALID: Frame must be finite and non-negative."]
    };
  }
  const safeLayers = sanitizeAnimationLayers(layers);
  const clipById = new Map(clips.map((clip) => [clip.id, clip]));
  const values = cloneValues(baseValues);
  const activeLayerIds: string[] = [];
  const vfxEffectIds: string[] = [];
  const warnings: string[] = [];

  for (const layer of safeLayers) {
    if (layer.muted || layer.weight <= 0) continue;
    if (layer.kind === "vfxSync") {
      activeLayerIds.push(layer.id);
      vfxEffectIds.push(...layer.vfxEffectIds);
      continue;
    }
    let layerActive = false;
    for (const instance of layer.clips) {
      if (instance.muted || instance.weight <= 0 ||
        frame < instance.startFrame ||
        frame > instance.startFrame + instance.durationFrames) {
        continue;
      }
      const clip = clipById.get(instance.clipId);
      if (!clip) {
        warnings.push(`ANIMATION_LAYER_CLIP_MISSING: ${instance.clipId}`);
        continue;
      }
      const localFrame = Math.min(
        clip.durationFrames,
        Math.max(0, (frame - instance.startFrame) * instance.timeScale)
      );
      const influence = layer.weight * instance.weight;
      for (const track of clip.tracks) {
        if (!isPropertyAllowedForAnimationLayer(layer.kind, track.property) ||
          !validClipTrack(track.property, track.keyframes)) {
          continue;
        }
        const sampled = sampleVectorTrack(track.keyframes, localFrame);
        if (!sampled) continue;
        const current = values[track.property] ?? [0, 0, 0];
        values[track.property] = layer.blendMode === "additive"
          ? addDelta(
              current,
              sampled,
              sampleVectorTrack(track.keyframes, 0) ?? [0, 0, 0],
              influence
            )
          : lerpVector3(current, sampled, influence);
        layerActive = true;
      }
    }
    if (layerActive) activeLayerIds.push(layer.id);
  }

  return {
    values,
    activeLayerIds,
    vfxEffectIds: [...new Set(vfxEffectIds)],
    warnings: [...new Set(warnings)]
  };
}

export function isPropertyAllowedForAnimationLayer(
  kind: AnimationLayerKind,
  property: AnimatableProperty
): boolean {
  if (kind === "base" || kind === "additiveMotion") return true;
  if (!property.startsWith("bone.rotation.")) return false;
  const boneId = property.slice("bone.rotation.".length);
  if (kind === "upperBody") return UPPER_BODY_BONES.has(boneId);
  if (kind === "headLook") return boneId === "head";
  if (kind === "handAdjustment") return HAND_BONES.has(boneId);
  return false;
}

function validClipTrack(
  property: AnimatableProperty,
  keyframes: ReusableAnimationClip["tracks"][number]["keyframes"]
): boolean {
  return (
    property === "transform.position" ||
    property === "transform.rotation" ||
    property === "transform.scale" ||
    /^bone\.rotation\.[a-zA-Z0-9._:-]{1,128}$/.test(property)
  ) &&
    Array.isArray(keyframes) &&
    keyframes.length <= 4_096 &&
    keyframes.every((keyframe) =>
      typeof keyframe.frame === "number" &&
      Number.isFinite(keyframe.frame) &&
      Array.isArray(keyframe.value) &&
      keyframe.value.length === 3 &&
      keyframe.value.every((component) =>
        typeof component === "number" &&
        Number.isFinite(component) &&
        Math.abs(component) <= 30_000_000
      )
    );
}

function addDelta(
  current: RigVector3Tuple,
  sampled: RigVector3Tuple,
  reference: RigVector3Tuple,
  influence: number
): RigVector3Tuple {
  return current.map((component, index) =>
    component + (sampled[index] - reference[index]) * influence
  ) as RigVector3Tuple;
}

function cloneValues(
  values: Readonly<Record<string, Vector3Tuple>>
): Record<string, RigVector3Tuple> {
  return Object.fromEntries(
    Object.entries(values).flatMap(([property, value]) =>
      Array.isArray(value) &&
      value.length === 3 &&
      value.every((component) =>
        typeof component === "number" &&
        Number.isFinite(component) &&
        Math.abs(component) <= 30_000_000
      )
        ? [[property, [...value] as RigVector3Tuple]]
        : []
    )
  );
}
