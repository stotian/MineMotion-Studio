import type {
  NlaTrackData,
  ReusableAnimationClip
} from "../../project/ProjectFile";
import {
  createAnimationLayer,
  sanitizeAnimationLayers,
  type AnimationLayerData,
  type AnimationLayerKind
} from "./AnimationLayer";

export function getNlaLayerKind(track: NlaTrackData): AnimationLayerKind {
  return track.layerKind ?? "base";
}

export function nlaTrackToAnimationLayer(
  track: NlaTrackData
): AnimationLayerData | null {
  return sanitizeAnimationLayers([{
    version: 1,
    id: track.id,
    targetId: track.targetId,
    kind: getNlaLayerKind(track),
    blendMode: track.blendMode,
    weight: track.weight ?? 1,
    muted: track.muted === true,
    clips: track.clips,
    vfxEffectIds: track.vfxEffectIds ?? []
  }])[0] ?? null;
}

export function getTargetAnimationLayers(
  tracks: readonly NlaTrackData[],
  targetId: string
): AnimationLayerData[] {
  return sanitizeAnimationLayers(
    tracks
      .filter((track) => track.targetId === targetId)
      .map((track) => ({
        version: 1,
        id: track.id,
        targetId: track.targetId,
        kind: getNlaLayerKind(track),
        blendMode: track.blendMode,
        weight: track.weight ?? 1,
        muted: track.muted === true,
        clips: track.clips,
        vfxEffectIds: track.vfxEffectIds ?? []
      }))
  );
}

export function createNlaLayerTrack(
  targetId: string,
  kind: AnimationLayerKind,
  clips: NlaTrackData["clips"] = []
): NlaTrackData {
  const layer = createAnimationLayer(targetId, kind);
  return {
    id: layer.id,
    name: kind,
    targetId,
    clips,
    layerKind: kind,
    blendMode: layer.blendMode,
    weight: layer.weight,
    muted: layer.muted,
    vfxEffectIds: []
  };
}

export function isClipCompatibleWithLayer(
  clip: ReusableAnimationClip,
  kind: AnimationLayerKind
): boolean {
  if (kind === "vfxSync") return false;
  if (kind === "base" || kind === "additiveMotion") return true;
  return clip.tracks.some((track) => {
    if (!track.property.startsWith("bone.rotation.")) return false;
    const bone = track.property.slice("bone.rotation.".length);
    if (kind === "headLook") return bone === "head";
    if (kind === "handAdjustment") {
      return ["leftArm", "leftForearm", "rightArm", "rightForearm"].includes(bone);
    }
    return ["body", "cape", "head", "leftArm", "leftForearm", "rightArm", "rightForearm"]
      .includes(bone);
  });
}
