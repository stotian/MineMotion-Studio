import type {
  AnimationTrack,
  Keyframe,
  KeyframeInterpolation,
  Vector3Tuple
} from "../../project/ProjectFile";

export interface KeyframeRef {
  trackId: string;
  keyframeId: string;
}

export interface LocatedKeyframe {
  track: AnimationTrack;
  keyframe: Keyframe<Vector3Tuple>;
  trackIndex: number;
  keyframeIndex: number;
}

export function ensureKeyframeMetadata(tracks: AnimationTrack[]): AnimationTrack[] {
  return tracks.map((track) => ({
    ...track,
    keyframes: track.keyframes
      .map((keyframe, index) => ({
        ...keyframe,
        id: keyframe.id ?? stableKeyframeId(track.id, keyframe.frame, index),
        value: [...keyframe.value] as Vector3Tuple,
        interpolation: normalizeInterpolation(keyframe.interpolation)
      }))
      .sort((left, right) => left.frame - right.frame)
  }));
}

export function locateKeyframe(
  tracks: AnimationTrack[],
  ref: KeyframeRef
): LocatedKeyframe | null {
  const trackIndex = tracks.findIndex((track) => track.id === ref.trackId);
  if (trackIndex < 0) return null;
  const track = tracks[trackIndex];
  const keyframeIndex = track.keyframes.findIndex(
    (keyframe, index) => getKeyframeId(track, keyframe, index) === ref.keyframeId
  );
  if (keyframeIndex < 0) return null;
  return { track, keyframe: track.keyframes[keyframeIndex], trackIndex, keyframeIndex };
}

export function getKeyframeId(
  track: AnimationTrack,
  keyframe: Keyframe<Vector3Tuple>,
  index: number
): string {
  return keyframe.id ?? stableKeyframeId(track.id, keyframe.frame, index);
}

export function keyframeRefKey(ref: KeyframeRef): string {
  return `${ref.trackId}\u0000${ref.keyframeId}`;
}

export function normalizeInterpolation(
  value: KeyframeInterpolation | undefined
): KeyframeInterpolation {
  return value ?? "linear";
}

function stableKeyframeId(trackId: string, frame: number, index: number): string {
  return `key_${hash(`${trackId}:${frame}:${index}`)}`;
}

function hash(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}
