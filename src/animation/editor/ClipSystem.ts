import { createKeyframeId } from "../Keyframe";
import type {
  AnimationTrack,
  ReusableAnimationClip,
  Vector3Tuple
} from "../../project/ProjectFile";
import {
  ensureKeyframeMetadata,
  keyframeRefKey,
  type KeyframeRef
} from "./KeyframeModel";

export function createAnimationClip(
  name: string,
  tracks: AnimationTrack[],
  selection: KeyframeRef[],
  targetType: ReusableAnimationClip["targetType"] = "object"
): ReusableAnimationClip | null {
  const selected = new Set(selection.map(keyframeRefKey));
  const normalized = ensureKeyframeMetadata(tracks);
  const included = normalized.flatMap((track) => {
    const keyframes = track.keyframes.filter((keyframe) =>
      selected.has(keyframeRefKey({ trackId: track.id, keyframeId: keyframe.id! }))
    );
    return keyframes.length > 0 ? [{ property: track.property, keyframes }] : [];
  });
  if (included.length === 0) return null;
  const firstFrame = Math.min(
    ...included.flatMap((track) => track.keyframes.map((keyframe) => keyframe.frame))
  );
  const lastFrame = Math.max(
    ...included.flatMap((track) => track.keyframes.map((keyframe) => keyframe.frame))
  );
  return {
    id: `clip_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || "Animation Clip",
    description: "Reusable keyframe clip",
    targetType,
    durationFrames: Math.max(1, lastFrame - firstFrame),
    tracks: included.map((track) => ({
      property: track.property,
      keyframes: track.keyframes.map((keyframe) => ({
        ...keyframe,
        id: createKeyframeId(keyframe.frame - firstFrame),
        frame: keyframe.frame - firstFrame,
        value: [...keyframe.value] as Vector3Tuple
      }))
    })),
    createdAt: new Date().toISOString()
  };
}

export function applyAnimationClip(
  tracks: AnimationTrack[],
  clip: ReusableAnimationClip,
  targetId: string,
  startFrame: number
): AnimationTrack[] {
  const nextTracks = ensureKeyframeMetadata(tracks).map((track) => ({
    ...track,
    keyframes: [...track.keyframes]
  }));
  for (const clipTrack of clip.tracks) {
    let targetTrack = nextTracks.find(
      (track) => track.targetId === targetId && track.property === clipTrack.property
    );
    if (!targetTrack) {
      targetTrack = {
        id: `${targetId}:${clipTrack.property}`,
        targetId,
        property: clipTrack.property,
        keyframes: []
      };
      nextTracks.push(targetTrack);
    }
    for (const keyframe of clipTrack.keyframes) {
      const frame = Math.max(0, Math.round(startFrame + keyframe.frame));
      targetTrack.keyframes.push({
        ...keyframe,
        id: createKeyframeId(frame),
        frame,
        value: [...keyframe.value]
      });
    }
    targetTrack.keyframes.sort((left, right) => left.frame - right.frame);
  }
  return nextTracks;
}

export function isAnimationClipCompatible(
  clip: ReusableAnimationClip,
  targetType: ReusableAnimationClip["targetType"]
): boolean {
  return clip.targetType === targetType;
}

export function serializeAnimationClip(clip: ReusableAnimationClip): string {
  return JSON.stringify(clip);
}

export function parseAnimationClip(raw: string): ReusableAnimationClip {
  const parsed = JSON.parse(raw) as ReusableAnimationClip;
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.tracks)) {
    throw new Error("Animation clip is invalid.");
  }
  return {
    ...parsed,
    name: parsed.name?.trim() || "Animation Clip",
    description: parsed.description ?? "Reusable keyframe clip",
    durationFrames: Math.max(1, Math.round(parsed.durationFrames || 1)),
    createdAt: parsed.createdAt ?? new Date(0).toISOString(),
    tracks: parsed.tracks.map((track) => ({
      ...track,
      keyframes: track.keyframes.map((keyframe, index) => ({
        ...keyframe,
        id: keyframe.id ?? `clip_key_${index}`,
        frame: Math.max(0, Math.round(keyframe.frame)),
        value: [...keyframe.value] as Vector3Tuple,
        interpolation: keyframe.interpolation ?? "linear"
      }))
    }))
  };
}
