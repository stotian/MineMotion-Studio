import type { AnimationTrack, TimelineData } from "../project/ProjectFile";

export function upsertTrack(
  timeline: TimelineData,
  track: AnimationTrack
): TimelineData {
  const trackIndex = timeline.tracks.findIndex((item) => item.id === track.id);
  if (trackIndex === -1) {
    return {
      ...timeline,
      tracks: [...timeline.tracks, track]
    };
  }

  return {
    ...timeline,
    tracks: timeline.tracks.map((item) => (item.id === track.id ? track : item))
  };
}

