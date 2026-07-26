import { createKeyframeId } from "../Keyframe";
import { lerpVector3 } from "../Interpolation";
import type {
  AnimationTrack,
  KeyframeInterpolation,
  Vector3Tuple
} from "../../project/ProjectFile";
import {
  ensureKeyframeMetadata,
  keyframeRefKey,
  type KeyframeRef
} from "./KeyframeModel";

export interface KeyframeCleanupResult {
  tracks: AnimationTrack[];
  selection: KeyframeRef[];
  changed: boolean;
  removedCount: number;
}

export function moveSelectedKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  deltaFrames: number,
  maxFrame = Number.MAX_SAFE_INTEGER
): AnimationTrack[] {
  const selected = new Set(selection.map(keyframeRefKey));
  const delta = Math.round(deltaFrames);
  return ensureKeyframeMetadata(tracks).map((track) => ({
    ...track,
    keyframes: track.keyframes
      .map((keyframe) =>
        selected.has(keyframeRefKey({ trackId: track.id, keyframeId: keyframe.id! }))
          ? {
              ...keyframe,
              frame: Math.min(maxFrame, Math.max(0, keyframe.frame + delta))
            }
          : keyframe
      )
      .sort((left, right) => left.frame - right.frame)
  }));
}

export function deleteSelectedKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[]
): AnimationTrack[] {
  const selected = new Set(selection.map(keyframeRefKey));
  return ensureKeyframeMetadata(tracks)
    .map((track) => ({
      ...track,
      keyframes: track.keyframes.filter(
        (keyframe) =>
          !selected.has(
            keyframeRefKey({ trackId: track.id, keyframeId: keyframe.id! })
          )
      )
    }))
    .filter((track) => track.keyframes.length > 0);
}

export function duplicateSelectedKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  offsetFrames = 1,
  maxFrame = Number.MAX_SAFE_INTEGER
): { tracks: AnimationTrack[]; selection: KeyframeRef[] } {
  const selected = new Set(selection.map(keyframeRefKey));
  const nextSelection: KeyframeRef[] = [];
  const nextTracks = ensureKeyframeMetadata(tracks).map((track) => {
    const duplicates = track.keyframes.flatMap((keyframe) => {
      const ref = { trackId: track.id, keyframeId: keyframe.id! };
      if (!selected.has(keyframeRefKey(ref))) return [];
      const frame = Math.min(maxFrame, Math.max(0, keyframe.frame + Math.round(offsetFrames)));
      const id = createKeyframeId(frame);
      nextSelection.push({ trackId: track.id, keyframeId: id });
      return [{ ...keyframe, id, frame, value: [...keyframe.value] as Vector3Tuple }];
    });
    return {
      ...track,
      keyframes: [...track.keyframes, ...duplicates].sort(
        (left, right) => left.frame - right.frame
      )
    };
  });
  return { tracks: nextTracks, selection: nextSelection };
}

export function snapSelectedKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  interval = 1,
  maxFrame = Number.MAX_SAFE_INTEGER
): AnimationTrack[] {
  const step = Math.max(1, Math.round(interval));
  const selected = new Set(selection.map(keyframeRefKey));
  return ensureKeyframeMetadata(tracks).map((track) => ({
    ...track,
    keyframes: track.keyframes
      .map((keyframe) =>
        selected.has(keyframeRefKey({ trackId: track.id, keyframeId: keyframe.id! }))
          ? {
              ...keyframe,
              frame: Math.min(maxFrame, Math.round(keyframe.frame / step) * step)
            }
          : keyframe
      )
      .sort((left, right) => left.frame - right.frame)
  }));
}

export function scaleSelectedKeyframeTiming(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  scale: number,
  pivotFrame: number,
  maxFrame = Number.MAX_SAFE_INTEGER
): AnimationTrack[] {
  const safeScale = Math.max(0.01, scale);
  const selected = new Set(selection.map(keyframeRefKey));
  return ensureKeyframeMetadata(tracks).map((track) => ({
    ...track,
    keyframes: track.keyframes
      .map((keyframe) =>
        selected.has(keyframeRefKey({ trackId: track.id, keyframeId: keyframe.id! }))
          ? {
              ...keyframe,
              frame: Math.min(
                maxFrame,
                Math.max(0, Math.round(pivotFrame + (keyframe.frame - pivotFrame) * safeScale))
              )
            }
          : keyframe
      )
      .sort((left, right) => left.frame - right.frame)
  }));
}

export function setSelectedInterpolation(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  interpolation: KeyframeInterpolation
): AnimationTrack[] {
  const selected = new Set(selection.map(keyframeRefKey));
  return ensureKeyframeMetadata(tracks).map((track) => ({
    ...track,
    keyframes: track.keyframes.map((keyframe) =>
      selected.has(keyframeRefKey({ trackId: track.id, keyframeId: keyframe.id! }))
        ? { ...keyframe, interpolation }
        : keyframe
    )
  }));
}

export function removeRedundantSelectedKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[]
): KeyframeCleanupResult {
  return removeSelectedKeysWithinError(tracks, selection, 1e-6, true);
}

export function reduceSelectedKeyframeNoise(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  tolerance = 0.25
): KeyframeCleanupResult {
  return removeSelectedKeysWithinError(
    tracks,
    selection,
    boundedNumber(tolerance, 0, 180, 0.25),
    false
  );
}

export function smoothSelectedKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  amount = 0.5
): AnimationTrack[] {
  const influence = boundedNumber(amount, 0, 1, 0.5);
  if (influence === 0 || selection.length === 0) return tracks;
  const selected = new Set(selection.map(keyframeRefKey));
  let changed = false;
  const normalized = ensureKeyframeMetadata(tracks);
  const output = normalized.map((track) => {
    const keyframes = track.keyframes.map((keyframe, index, source) => {
      if (index === 0 || index === source.length - 1 ||
        !selected.has(keyframeRefKey({
          trackId: track.id,
          keyframeId: keyframe.id!
        }))) {
        return keyframe;
      }
      const predicted = interpolateBetweenNeighbors(
        source[index - 1],
        source[index + 1],
        keyframe.frame
      );
      if (!predicted) return keyframe;
      const value = lerpVector3(keyframe.value, predicted, influence);
      if (maximumVectorError(value, keyframe.value) <= Number.EPSILON) {
        return keyframe;
      }
      changed = true;
      return { ...keyframe, value };
    });
    return { ...track, keyframes };
  });
  return changed ? output : tracks;
}

function removeSelectedKeysWithinError(
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  tolerance: number,
  requireLinear: boolean
): KeyframeCleanupResult {
  if (selection.length === 0) {
    return { tracks, selection, changed: false, removedCount: 0 };
  }
  const selected = new Set(selection.map(keyframeRefKey));
  const removed = new Set<string>();
  const normalized = ensureKeyframeMetadata(tracks);
  const output = normalized.map((track) => {
    const keyframes = [...track.keyframes];
    let index = 1;
    while (index < keyframes.length - 1) {
      const keyframe = keyframes[index];
      const ref = { trackId: track.id, keyframeId: keyframe.id! };
      const refKey = keyframeRefKey(ref);
      if (!selected.has(refKey)) {
        index += 1;
        continue;
      }
      const left = keyframes[index - 1];
      const right = keyframes[index + 1];
      if (requireLinear &&
        ((left.interpolation ?? "linear") !== "linear" ||
          (keyframe.interpolation ?? "linear") !== "linear")) {
        index += 1;
        continue;
      }
      const predicted = interpolateBetweenNeighbors(
        left,
        right,
        keyframe.frame
      );
      if (!predicted ||
        maximumVectorError(predicted, keyframe.value) > tolerance) {
        index += 1;
        continue;
      }
      removed.add(refKey);
      keyframes.splice(index, 1);
    }
    return { ...track, keyframes };
  });
  if (removed.size === 0) {
    return { tracks, selection, changed: false, removedCount: 0 };
  }
  return {
    tracks: output,
    selection: selection.filter((ref) => !removed.has(keyframeRefKey(ref))),
    changed: true,
    removedCount: removed.size
  };
}

function interpolateBetweenNeighbors(
  left: AnimationTrack["keyframes"][number],
  right: AnimationTrack["keyframes"][number],
  frame: number
): Vector3Tuple | null {
  const span = right.frame - left.frame;
  if (!Number.isFinite(span) || span <= 0) return null;
  const amount = (frame - left.frame) / span;
  if (!Number.isFinite(amount) || amount <= 0 || amount >= 1) return null;
  return lerpVector3(left.value, right.value, amount);
}

function maximumVectorError(
  left: Vector3Tuple,
  right: Vector3Tuple
): number {
  return Math.max(
    Math.abs(left[0] - right[0]),
    Math.abs(left[1] - right[1]),
    Math.abs(left[2] - right[2])
  );
}

function boundedNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}
