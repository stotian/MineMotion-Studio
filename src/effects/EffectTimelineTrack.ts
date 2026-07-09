import type { EffectInstance, TimelineEffectItem } from "./EffectTypes";

export function createEffectTimelineItems(
  effects: EffectInstance[]
): TimelineEffectItem[] {
  return effects
    .filter((effect) => effect.enabled)
    .map((effect) => ({
      effectId: effect.id,
      startFrame: effect.startFrame,
      durationFrames: effect.durationFrames
    }))
    .sort((left, right) => left.startFrame - right.startFrame);
}
