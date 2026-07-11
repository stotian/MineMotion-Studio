import type {
  NlaClipInstance,
  NlaTrackData,
  ReusableAnimationClip
} from "../../project/ProjectFile";
import { createId } from "../../core/ids/Id";

export function addClipToNla(
  tracks: NlaTrackData[],
  clip: ReusableAnimationClip,
  targetId: string,
  startFrame: number
): NlaTrackData[] {
  const instance: NlaClipInstance = {
    id: createId("nla_clip"),
    clipId: clip.id,
    targetId,
    startFrame: Math.max(0, Math.round(startFrame)),
    durationFrames: clip.durationFrames,
    timeScale: 1,
    weight: 1,
    muted: false
  };
  const track = tracks.find((candidate) => candidate.targetId === targetId);
  if (!track) {
    return [
      ...tracks,
      {
        id: `nla_${targetId}`,
        name: "NLA Clips",
        targetId,
        clips: [instance]
      }
    ];
  }
  return tracks.map((candidate) =>
    candidate.id === track.id
      ? { ...candidate, clips: [...candidate.clips, instance] }
      : candidate
  );
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
            startFrame: Math.max(0, Math.round(patch.startFrame ?? clip.startFrame)),
            durationFrames: Math.max(1, Math.round(patch.durationFrames ?? clip.durationFrames)),
            timeScale: Math.max(0.01, patch.timeScale ?? clip.timeScale),
            weight: Math.min(1, Math.max(0, patch.weight ?? clip.weight))
          }
        : clip
    )
  }));
}
