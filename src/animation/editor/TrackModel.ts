import type { AnimationTrack, MineMotionProject } from "../../project/ProjectFile";
import { findObject } from "../../project/ProjectStore";

export interface TrackHierarchyGroup {
  targetId: string;
  targetName: string;
  targetType: string;
  tracks: AnimationTrack[];
}

export function buildTrackHierarchy(project: MineMotionProject): TrackHierarchyGroup[] {
  const groups = new Map<string, AnimationTrack[]>();
  for (const track of project.animation.tracks) {
    groups.set(track.targetId, [...(groups.get(track.targetId) ?? []), track]);
  }
  return Array.from(groups.entries()).map(([targetId, tracks]) => {
    const entity = findObject(project, targetId)?.entity;
    return {
      targetId,
      targetName: entity?.name ?? targetId,
      targetType: entity?.type ?? "unknown",
      tracks: [...tracks].sort((left, right) => left.property.localeCompare(right.property))
    };
  });
}
