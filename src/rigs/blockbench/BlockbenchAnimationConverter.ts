import { createDeterministicId } from "../../core/ids/Id";
import type {
  KeyframeInterpolation,
  ReusableAnimationClip,
  Vector3Tuple
} from "../../project/ProjectFile";
import type { BlockbenchBoneMappingReport } from "./BlockbenchMapping";
import { findMappingSourceId } from "./BlockbenchMapping";
import type {
  BlockbenchAnimation,
  BlockbenchAnimationKeyframe,
  ParsedBlockbenchModel
} from "./BlockbenchTypes";

export const BLOCKBENCH_ANIMATION_LIMITS = Object.freeze({
  timelineFrame: 10_000_000,
  rotationDegrees: 3_600,
  fps: 240
});

export interface BlockbenchAnimationOption {
  id: string;
  name: string;
  durationSeconds: number;
}

export interface BlockbenchAnimationConversionResult {
  clip: ReusableAnimationClip | null;
  warnings: string[];
  error: string | null;
}

export function listBlockbenchAnimations(
  model: ParsedBlockbenchModel
): BlockbenchAnimationOption[] {
  return model.animations.map((animation, index) => ({
    id: animationId(animation, index),
    name: animation.name?.trim() || `Animation ${index + 1}`,
    durationSeconds: animation.length ?? 0
  }));
}

export function convertBlockbenchAnimation(
  model: ParsedBlockbenchModel,
  mapping: BlockbenchBoneMappingReport,
  selectedAnimationId: string,
  fps: number,
  assetId: string,
  createdAt: string
): BlockbenchAnimationConversionResult {
  if (!Number.isInteger(fps) || fps <= 0 ||
    fps > BLOCKBENCH_ANIMATION_LIMITS.fps) {
    return failure(
      "BLOCKBENCH_ANIMATION_FPS_INVALID: Timeline FPS is outside the supported range."
    );
  }
  const animationIndex = model.animations.findIndex(
    (animation, index) => animationId(animation, index) === selectedAnimationId
  );
  if (animationIndex < 0) {
    return failure(
      "BLOCKBENCH_ANIMATION_MISSING: The selected Blockbench clip does not exist."
    );
  }
  const animation = model.animations[animationIndex];
  const mappedBySource = new Map(
    mapping.entries.flatMap((entry) =>
      entry.targetBoneId
        ? [[entry.sourceGroupId, entry.targetBoneId] as const]
        : []
    )
  );
  const warnings = new Set<string>();
  const animatorTargets = new Set<string>();
  const trackFrames = new Map<
    string,
    Map<number, {
      value: Vector3Tuple;
      interpolation: KeyframeInterpolation;
    }>
  >();

  for (const [animatorId, animator] of Object.entries(
    animation.animators ?? {}
  )) {
    if (animator.type && animator.type !== "bone") {
      warnings.add(
        "BLOCKBENCH_ANIMATOR_TYPE_UNSUPPORTED: Non-bone animator data was skipped."
      );
      continue;
    }
    const sourceId = findMappingSourceId(mapping, animatorId, animator.name);
    const targetBoneId = sourceId
      ? mappedBySource.get(sourceId)
      : undefined;
    if (!targetBoneId) {
      warnings.add(
        "BLOCKBENCH_ANIMATOR_UNMAPPED: Animation data for an unmapped group was skipped."
      );
      continue;
    }
    if (animatorTargets.has(targetBoneId)) {
      warnings.add(
        "BLOCKBENCH_ANIMATOR_TARGET_CONFLICT: Duplicate animators for one rig bone were skipped."
      );
      continue;
    }
    animatorTargets.add(targetBoneId);
    const frames = trackFrames.get(targetBoneId) ?? new Map();
    for (const keyframe of animator.keyframes ?? []) {
      if (keyframe.channel !== "rotation") {
        warnings.add(
          "BLOCKBENCH_ANIMATION_CHANNEL_UNSUPPORTED: Only bone rotation channels are imported."
        );
        continue;
      }
      const rotation = readRotation(keyframe);
      if (!rotation) {
        warnings.add(
          "BLOCKBENCH_ANIMATION_VALUE_UNSUPPORTED: Non-numeric rotation expressions were skipped."
        );
        continue;
      }
      const frame = Math.round((keyframe.time ?? 0) * fps);
      if (!Number.isSafeInteger(frame) ||
        frame < 0 ||
        frame > BLOCKBENCH_ANIMATION_LIMITS.timelineFrame) {
        warnings.add(
          "BLOCKBENCH_ANIMATION_FRAME_INVALID: A keyframe fell outside timeline limits."
        );
        continue;
      }
      frames.set(frame, {
        value: rotation,
        interpolation: mapInterpolation(keyframe.interpolation, warnings)
      });
    }
    if (frames.size > 0) trackFrames.set(targetBoneId, frames);
  }

  if (trackFrames.size === 0) {
    return {
      clip: null,
      warnings: [...warnings],
      error:
        "BLOCKBENCH_ANIMATION_NO_MAPPED_KEYS: No supported mapped rotation keys were found."
    };
  }
  const durationFromSource = Math.round((animation.length ?? 0) * fps);
  const lastFrame = Math.max(
    0,
    ...[...trackFrames.values()].flatMap((frames) => [...frames.keys()])
  );
  const durationFrames = Math.max(1, durationFromSource, lastFrame);
  if (durationFrames > BLOCKBENCH_ANIMATION_LIMITS.timelineFrame) {
    return failure(
      "BLOCKBENCH_ANIMATION_RANGE_INVALID: Imported clip exceeds the timeline limit.",
      [...warnings]
    );
  }
  const identity = `${assetId}:${selectedAnimationId}:${fps}`;
  const clip: ReusableAnimationClip = {
    id: createDeterministicId("blockbench_clip", identity),
    name: animation.name?.trim() || `Animation ${animationIndex + 1}`,
    description: `Imported from Blockbench asset ${model.name}.`,
    targetType: "character",
    durationFrames,
    tracks: [...trackFrames.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([boneId, frames]) => ({
        property: `bone.rotation.${boneId}`,
        keyframes: [...frames.entries()]
          .sort(([left], [right]) => left - right)
          .map(([frame, keyframe]) => ({
            id: createDeterministicId(
              "blockbench_key",
              `${identity}:${boneId}:${frame}`
            ),
            frame,
            value: [...keyframe.value] as Vector3Tuple,
            interpolation: keyframe.interpolation
          }))
      })),
    createdAt: Number.isFinite(Date.parse(createdAt))
      ? createdAt
      : "1970-01-01T00:00:00.000Z"
  };
  return { clip, warnings: [...warnings], error: null };
}

function animationId(
  animation: BlockbenchAnimation,
  index: number
): string {
  return animation.uuid?.trim() || `animation:${index}`;
}

function readRotation(
  keyframe: BlockbenchAnimationKeyframe
): Vector3Tuple | null {
  const point = keyframe.data_points?.[0];
  if (!point) return null;
  const rotation = [
    finiteNumericValue(point.x),
    finiteNumericValue(point.y),
    finiteNumericValue(point.z)
  ];
  if (rotation.some((value) => value === null)) return null;
  if (rotation.some((value) =>
    Math.abs(value!) > BLOCKBENCH_ANIMATION_LIMITS.rotationDegrees)) {
    return null;
  }
  return rotation as Vector3Tuple;
}

function finiteNumericValue(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string" ||
    !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapInterpolation(
  value: string | undefined,
  warnings: Set<string>
): KeyframeInterpolation {
  if (!value || value === "linear") return "linear";
  if (value === "step") return "constant";
  warnings.add(
    "BLOCKBENCH_INTERPOLATION_APPROXIMATED: Unsupported interpolation was imported as linear."
  );
  return "linear";
}

function failure(
  error: string,
  warnings: string[] = []
): BlockbenchAnimationConversionResult {
  return { clip: null, warnings, error };
}
