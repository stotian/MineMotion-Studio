import { createAudioTimelineItems } from "../audio/AudioTrack";
import { createEffectTimelineItems } from "../effects/EffectTimelineTrack";
import type { MineMotionProject, TimelineItem } from "./ProjectFile";
import { createDefaultTimelineTracks } from "./ProjectStore";

export function syncCinematicTimeline(
  project: MineMotionProject
): MineMotionProject {
  const effectItems: TimelineItem[] = createEffectTimelineItems(
    project.effects.instances
  ).map((item) => {
    const effect = project.effects.instances.find(
      (candidate) => candidate.id === item.effectId
    );
    return {
      id: `item_${item.effectId}`,
      type: "effect",
      label: effect?.name ?? item.effectId,
      targetId: item.effectId,
      effectId: item.effectId,
      startFrame: item.startFrame,
      durationFrames: item.durationFrames
    };
  });

  const audioItems: TimelineItem[] = createAudioTimelineItems(
    project.audio.clips
  ).map((item) => {
    const clip = project.audio.clips.find(
      (candidate) => candidate.id === item.clipId
    );
    return {
      id: `item_${item.clipId}`,
      type: "audio",
      label: clip?.name ?? item.clipId,
      targetId: item.clipId,
      audioClipId: item.clipId,
      startFrame: item.startFrame,
      durationFrames: item.durationFrames
    };
  });

  const existingTracks = project.animation.timelineTracks;
  const defaults = createDefaultTimelineTracks();
  const timelineTracks = defaults.map((defaultTrack) => {
    const existing = existingTracks.find((track) => track.id === defaultTrack.id);
    if (defaultTrack.type === "effect") {
      return { ...(existing ?? defaultTrack), items: effectItems };
    }
    if (defaultTrack.type === "audio") {
      return { ...(existing ?? defaultTrack), items: audioItems };
    }
    return existing ?? defaultTrack;
  });

  return {
    ...project,
    animation: {
      ...project.animation,
      timelineTracks
    }
  };
}
