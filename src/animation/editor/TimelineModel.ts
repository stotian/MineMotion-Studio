import type { MineMotionProject } from "../../project/ProjectFile";
import { buildTrackHierarchy, type TrackHierarchyGroup } from "./TrackModel";

export interface TimelineEditorModel {
  fps: number;
  durationFrames: number;
  currentFrame: number;
  groups: TrackHierarchyGroup[];
  markerCount: number;
  clipCount: number;
  nlaTrackCount: number;
}

export function buildTimelineModel(project: MineMotionProject): TimelineEditorModel {
  return {
    fps: project.animation.fps,
    durationFrames: project.animation.durationFrames,
    currentFrame: project.animation.currentFrame,
    groups: buildTrackHierarchy(project),
    markerCount: project.animation.markers.length,
    clipCount: project.animation.clips.length,
    nlaTrackCount: project.animation.nlaTracks.length
  };
}
