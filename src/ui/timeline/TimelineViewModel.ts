import type {
  AnimationTrack,
  NlaClipInstance,
  TimelineItem,
  TimelineTrackLane
} from "../../project/ProjectFile";

export interface TimelinePercentStyle {
  left: string;
  width: string;
}

export function normalizeTimelineDuration(durationFrames: number): number {
  return Math.max(1, durationFrames);
}

export function createTimelineTicks(
  durationFrames: number,
  divisions = 20
): number[] {
  const duration = normalizeTimelineDuration(durationFrames);
  const safeDivisions = Math.max(1, Math.round(divisions));
  return Array.from({ length: safeDivisions + 1 }, (_, index) =>
    Math.round((duration / safeDivisions) * index)
  );
}

export function collectKeyframeFrames(tracks: readonly AnimationTrack[]): number[] {
  return [
    ...new Set(
      tracks.flatMap((track) =>
        track.keyframes.map((keyframe) => keyframe.frame)
      )
    )
  ];
}

export function shouldDisplayTimelineTrack(track: TimelineTrackLane): boolean {
  return (
    track.items.length > 0 ||
    ["rig", "effect", "audio", "sky"].includes(track.type)
  );
}

export function collectDisabledEffectIds(
  effects: readonly { id: string; enabled: boolean }[]
): Set<string> {
  return new Set(
    effects.filter((effect) => !effect.enabled).map((effect) => effect.id)
  );
}

export function getTimelineItemStyle(
  item: Pick<TimelineItem, "startFrame" | "durationFrames">,
  durationFrames: number
): TimelinePercentStyle {
  const duration = normalizeTimelineDuration(durationFrames);
  return {
    left: `${(item.startFrame / duration) * 100}%`,
    width: `${Math.max(1, (item.durationFrames / duration) * 100)}%`
  };
}

export function getNlaClipStyle(
  clip: Pick<NlaClipInstance, "startFrame" | "durationFrames">,
  durationFrames: number
): TimelinePercentStyle {
  const duration = normalizeTimelineDuration(durationFrames);
  return {
    left: `${(clip.startFrame / duration) * 100}%`,
    width: `${Math.max(2, (clip.durationFrames / duration) * 100)}%`
  };
}
