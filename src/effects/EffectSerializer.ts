import type { EffectInstance } from "./EffectTypes";
import { createId } from "../core/ids/Id";

export function withEffectDefaults(effect: Partial<EffectInstance>): EffectInstance {
  return {
    id: effect.id ?? createId("effect"),
    type: effect.type ?? "flash",
    name: effect.name ?? "Effect",
    startFrame: Math.max(0, Math.round(effect.startFrame ?? 0)),
    durationFrames: Math.max(1, Math.round(effect.durationFrames ?? 12)),
    position: effect.position ?? [0, 2, 0],
    targetObjectId: effect.targetObjectId ?? "",
    parameters: effect.parameters ?? {},
    enabled: effect.enabled ?? true
  };
}

export function sanitizeEffects(
  effects: Partial<EffectInstance>[] | undefined
): EffectInstance[] {
  if (!Array.isArray(effects)) return [];
  return effects.map(withEffectDefaults);
}
