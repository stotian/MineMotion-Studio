import { createAudioTimelineItems } from "../audio/AudioTrack";
import { createEffectTimelineLaneItems } from "../effects/EffectTimelineTrack";
import type { MineMotionProject, TimelineItem } from "./ProjectFile";
import { createDefaultTimelineTracks } from "./ProjectStore";
import { getRigTimelineItems } from "../rigs/RigSerializer";
import { mergeCanonicalTimelineTracks } from "./TimelineTrackSanitizer";

export function syncCinematicTimeline(
  project: MineMotionProject
): MineMotionProject {
  const effectItems: TimelineItem[] = createEffectTimelineLaneItems(
    project.effects.instances
  );

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
  const rigItems = getRigTimelineItems(project);
  const environmentItems: TimelineItem[] = project.lighting.keyframes.map(
    (keyframe) => ({
      id: `item_${keyframe.id}`,
      type: "sky",
      label: `Environment @ ${keyframe.frame}`,
      targetId: "environment",
      environmentKeyframeId: keyframe.id,
      startFrame: keyframe.frame,
      durationFrames: 1
    })
  );

  const existingTracks = project.animation.timelineTracks;
  const defaults = createDefaultTimelineTracks();
  const timelineTracks = defaults.map((defaultTrack) => {
    const existing = existingTracks.find((track) => track.id === defaultTrack.id);
    if (defaultTrack.type === "rig") {
      return {
        ...(existing ?? defaultTrack),
        id: defaultTrack.id,
        type: defaultTrack.type,
        items: rigItems
      };
    }
    if (defaultTrack.type === "effect") {
      return {
        ...(existing ?? defaultTrack),
        id: defaultTrack.id,
        type: defaultTrack.type,
        items: effectItems
      };
    }
    if (defaultTrack.type === "audio") {
      return {
        ...(existing ?? defaultTrack),
        id: defaultTrack.id,
        type: defaultTrack.type,
        items: audioItems
      };
    }
    if (defaultTrack.type === "sky") {
      return {
        ...(existing ?? defaultTrack),
        id: defaultTrack.id,
        type: defaultTrack.type,
        items: environmentItems
      };
    }
    return existing
      ? { ...existing, id: defaultTrack.id, type: defaultTrack.type }
      : defaultTrack;
  });
  const mergedTimelineTracks = mergeCanonicalTimelineTracks(
    existingTracks,
    timelineTracks
  );

  return {
    ...project,
    animation: {
      ...project.animation,
      timelineTracks: mergedTimelineTracks
    }
  };
}
