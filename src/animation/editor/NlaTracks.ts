import type {
  NlaClipInstance,
  NlaTrackData,
  ReusableAnimationClip
} from "../../project/ProjectFile";
import { createId } from "../../core/ids/Id";
import {
  createNlaLayerTrack,
  getNlaLayerKind,
  isClipCompatibleWithLayer
} from "../layers/AnimationLayerNlaAdapter";
import {
  ANIMATION_LAYER_LIMITS,
  type AnimationLayerKind
} from "../layers/AnimationLayer";

const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

export function addClipToNla(
  tracks: NlaTrackData[],
  clip: ReusableAnimationClip,
  targetId: string,
  startFrame: number
): NlaTrackData[] {
  return addClipToAnimationLayer(
    tracks,
    clip,
    targetId,
    startFrame,
    "base"
  );
}

export function addClipToAnimationLayer(
  tracks: NlaTrackData[],
  clip: ReusableAnimationClip,
  targetId: string,
  startFrame: number,
  layerKind: AnimationLayerKind
): NlaTrackData[] {
  if (!isClipCompatibleWithLayer(clip, layerKind)) return tracks;
  const instance: NlaClipInstance = {
    id: createId("nla_clip"),
    clipId: clip.id,
    targetId,
    startFrame: boundedInteger(
      startFrame,
      0,
      ANIMATION_LAYER_LIMITS.frame,
      0
    ),
    durationFrames: boundedInteger(
      clip.durationFrames,
      1,
      ANIMATION_LAYER_LIMITS.durationFrames,
      1
    ),
    timeScale: 1,
    weight: 1,
    muted: false
  };
  const track = tracks.find((candidate) =>
    candidate.targetId === targetId &&
    getNlaLayerKind(candidate) === layerKind
  );
  if (!track) {
    const layer = createNlaLayerTrack(targetId, layerKind, [instance]);
    return [
      ...tracks,
      {
        ...layer,
        id: layerKind === "base" ? `nla_${targetId}` : layer.id,
        name: layerKind === "base" ? "NLA Clips" : layer.name
      }
    ];
  }
  if (track.clips.length >= ANIMATION_LAYER_LIMITS.clipsPerLayer) return tracks;
  return tracks.map((candidate) =>
    candidate.id === track.id
      ? { ...candidate, clips: [...candidate.clips, instance] }
      : candidate
  );
}

export function updateNlaLayer(
  tracks: NlaTrackData[],
  layerId: string,
  patch: Pick<Partial<NlaTrackData>, "muted" | "weight" | "vfxEffectIds">
): NlaTrackData[] {
  return tracks.map((track) => {
    if (track.id !== layerId) return track;
    const kind = getNlaLayerKind(track);
    return {
      ...track,
      muted: patch.muted ?? track.muted ?? false,
      weight: Math.min(1, Math.max(0, finiteNumber(patch.weight, track.weight ?? 1))),
      vfxEffectIds: kind === "vfxSync"
        ? [...new Set((patch.vfxEffectIds ?? track.vfxEffectIds ?? [])
            .filter((id) => typeof id === "string" && ID_PATTERN.test(id))
            .slice(0, ANIMATION_LAYER_LIMITS.effectIds))]
        : []
    };
  });
}

export function ensureNlaLayer(
  tracks: NlaTrackData[],
  targetId: string,
  layerKind: AnimationLayerKind
): NlaTrackData[] {
  return tracks.some((track) =>
    track.targetId === targetId && getNlaLayerKind(track) === layerKind
  )
    ? tracks
    : [...tracks, createNlaLayerTrack(targetId, layerKind)];
}

export function updateNlaClip(
  tracks: NlaTrackData[],
  clipId: string,
  patch: Partial<NlaClipInstance>
): NlaTrackData[] {
  return tracks.map((track) => ({
    ...track,
    clips: track.clips.map((clip) =>
      clip.id === clipId
        ? {
            ...clip,
            ...patch,
            startFrame: boundedInteger(
              patch.startFrame,
              0,
              ANIMATION_LAYER_LIMITS.frame,
              clip.startFrame
            ),
            durationFrames: boundedInteger(
              patch.durationFrames,
              1,
              ANIMATION_LAYER_LIMITS.durationFrames,
              clip.durationFrames
            ),
            timeScale: boundedNumber(
              patch.timeScale,
              0.01,
              ANIMATION_LAYER_LIMITS.timeScale,
              clip.timeScale
            ),
            weight: boundedNumber(patch.weight, 0, 1, clip.weight)
          }
        : clip
    )
  }));
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function boundedNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  return Math.min(maximum, Math.max(minimum, finiteNumber(value, fallback)));
}

function boundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  return Math.round(boundedNumber(value, minimum, maximum, fallback));
}
