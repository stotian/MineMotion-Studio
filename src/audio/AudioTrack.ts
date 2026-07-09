import type { AudioClip, TimelineAudioItem } from "./AudioTypes";

export function createAudioTimelineItems(
  clips: AudioClip[]
): TimelineAudioItem[] {
  return clips
    .map((clip) => ({
      clipId: clip.id,
      startFrame: clip.startFrame,
      durationFrames: clip.durationFrames
    }))
    .sort((left, right) => left.startFrame - right.startFrame);
}
