import { createId } from "../project/ProjectStore";
import { createEffectInstance } from "./EffectRegistry";
import type { EffectInstance, EffectType } from "./EffectTypes";

export function spawnEffectAtFrame(
  type: EffectType,
  frame: number,
  targetObjectId = ""
): EffectInstance {
  return createEffectInstance(type, {
    id: createId("effect"),
    startFrame: frame,
    targetObjectId
  });
}
