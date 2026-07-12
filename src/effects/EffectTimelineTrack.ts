import type { MineMotionProject, TimelineItem } from "../project/ProjectFile";
import type { EffectInstance, TimelineEffectItem } from "./EffectTypes";

export const EFFECT_TIMELINE_TRACK_ID = "track_effects_main";

export function getTimelineFrameAtPosition(
  clientX: number,
  laneLeft: number,
  laneWidth: number,
  durationFrames: number
): number {
  if (
    !Number.isFinite(clientX) ||
    !Number.isFinite(laneLeft) ||
    !Number.isFinite(laneWidth) ||
    laneWidth <= 0 ||
    !Number.isSafeInteger(durationFrames) ||
    durationFrames < 1
  ) {
    throw new RangeError("Timeline pointer coordinates are invalid.");
  }
  const ratio = Math.min(1, Math.max(0, (clientX - laneLeft) / laneWidth));
  return Math.round(ratio * durationFrames);
}

export function getTimelineMoveStartFrame(
  dropFrame: number,
  grabOffsetFrames: number,
  effectDurationFrames: number,
  timelineDurationFrames: number
): number {
  if (
    !Number.isSafeInteger(dropFrame) ||
    !Number.isSafeInteger(grabOffsetFrames) ||
    !Number.isSafeInteger(effectDurationFrames) ||
    effectDurationFrames < 1 ||
    !Number.isSafeInteger(timelineDurationFrames) ||
    timelineDurationFrames < 1
  ) {
    throw new RangeError("Timeline move coordinates are invalid.");
  }
  const lastStart = Math.max(0, timelineDurationFrames - effectDurationFrames);
  return Math.min(lastStart, Math.max(0, dropFrame - grabOffsetFrames));
}

export function createEffectTimelineItems(
  effects: readonly EffectInstance[]
): TimelineEffectItem[] {
  return effects
    .map((effect, sourceOrder) => ({
      effectId: effect.id,
      startFrame: effect.startFrame,
      durationFrames: effect.durationFrames,
      sourceOrder
    }))
    .sort(
      (left, right) =>
        left.startFrame - right.startFrame || left.sourceOrder - right.sourceOrder
    )
    .map(({ sourceOrder: _sourceOrder, ...item }) => item);
}

export function createEffectTimelineLaneItems(
  effects: readonly EffectInstance[]
): TimelineItem[] {
  const namesById = new Map(effects.map((effect) => [effect.id, effect.name]));
  return createEffectTimelineItems(effects).map((item) => ({
    id: `item_${item.effectId}`,
    type: "effect",
    label: namesById.get(item.effectId) ?? item.effectId,
    targetId: item.effectId,
    effectId: item.effectId,
    startFrame: item.startFrame,
    durationFrames: item.durationFrames
  }));
}

export function syncEffectTimelineLane(
  project: MineMotionProject
): MineMotionProject {
  const sourceTracks = project.animation.timelineTracks;
  const canonicalTrack =
    sourceTracks.find((track) => track.id === EFFECT_TIMELINE_TRACK_ID) ??
    sourceTracks.find((track) => track.type === "effect");
  const effectTrack = {
    ...(canonicalTrack ?? {
      id: EFFECT_TIMELINE_TRACK_ID,
      type: "effect" as const,
      name: "Effects",
      items: []
    }),
    id: EFFECT_TIMELINE_TRACK_ID,
    type: "effect" as const,
    items: createEffectTimelineLaneItems(project.effects.instances)
  };
  const timelineTracks = [] as MineMotionProject["animation"]["timelineTracks"];
  let inserted = false;

  for (const track of sourceTracks) {
    const isEffectTrack =
      track.id === EFFECT_TIMELINE_TRACK_ID || track.type === "effect";
    if (!isEffectTrack) {
      timelineTracks.push(track);
      continue;
    }
    if (!inserted && track === canonicalTrack) {
      timelineTracks.push(effectTrack);
      inserted = true;
    }
  }
  if (!inserted) {
    timelineTracks.push(effectTrack);
  }

  return {
    ...project,
    animation: {
      ...project.animation,
      timelineTracks
    }
  };
}
