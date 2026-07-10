import { createKeyframeId } from "../Keyframe";
import type {
  AnimatableProperty,
  AnimationTrack,
  KeyframeInterpolation,
  Vector3Tuple
} from "../../project/ProjectFile";
import {
  ensureKeyframeMetadata,
  keyframeRefKey,
  type KeyframeRef
} from "./KeyframeModel";

export interface KeyframeClipboardEntry {
  sourceTrackId: string;
  property: AnimatableProperty;
  offsetFrame: number;
  value: Vector3Tuple;
  interpolation: KeyframeInterpolation;
}

export interface KeyframeClipboardData {
  entries: KeyframeClipboardEntry[];
  durationFrames: number;
}

export function copyKeyframes(
  tracks: AnimationTrack[],
  selection: KeyframeRef[]
): KeyframeClipboardData {
  const selected = new Set(selection.map(keyframeRefKey));
  const normalized = ensureKeyframeMetadata(tracks);
  const located = normalized.flatMap((track) =>
    track.keyframes.flatMap((keyframe) =>
      selected.has(keyframeRefKey({ trackId: track.id, keyframeId: keyframe.id! }))
        ? [{ track, keyframe }]
        : []
    )
  );
  if (located.length === 0) return { entries: [], durationFrames: 0 };
  const firstFrame = Math.min(...located.map(({ keyframe }) => keyframe.frame));
  const lastFrame = Math.max(...located.map(({ keyframe }) => keyframe.frame));
  return {
    entries: located.map(({ track, keyframe }) => ({
      sourceTrackId: track.id,
      property: track.property,
      offsetFrame: keyframe.frame - firstFrame,
      value: [...keyframe.value],
      interpolation: keyframe.interpolation ?? "linear"
    })),
    durationFrames: lastFrame - firstFrame
  };
}

export function pasteKeyframes(
  tracks: AnimationTrack[],
  clipboard: KeyframeClipboardData,
  atFrame: number,
  targetId?: string
): { tracks: AnimationTrack[]; selection: KeyframeRef[] } {
  const nextTracks = ensureKeyframeMetadata(tracks).map((track) => ({
    ...track,
    keyframes: [...track.keyframes]
  }));
  const selection: KeyframeRef[] = [];
  for (const entry of clipboard.entries) {
    let track = nextTracks.find((candidate) =>
      targetId
        ? candidate.targetId === targetId && candidate.property === entry.property
        : candidate.id === entry.sourceTrackId
    );
    if (!track && targetId) {
      track = {
        id: `${targetId}:${entry.property}`,
        targetId,
        property: entry.property,
        keyframes: []
      };
      nextTracks.push(track);
    }
    if (!track) continue;
    const frame = Math.max(0, Math.round(atFrame + entry.offsetFrame));
    const id = createKeyframeId(frame);
    track.keyframes.push({
      id,
      frame,
      value: [...entry.value],
      interpolation: entry.interpolation
    });
    track.keyframes.sort((left, right) => left.frame - right.frame);
    selection.push({ trackId: track.id, keyframeId: id });
  }
  return { tracks: nextTracks, selection };
}
