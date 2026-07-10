import { createKeyframeId } from "../Keyframe";
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
