import type { AnimationLayerKind } from "../../animation/layers/AnimationLayer";

export const CLIP_LAYER_KINDS: readonly AnimationLayerKind[] = [
  "base",
  "upperBody",
  "headLook",
  "handAdjustment",
  "additiveMotion"
];

export const ANIMATION_LAYER_TRANSLATION_KEYS = {
  base: "timeline.layer.base",
  upperBody: "timeline.layer.upperBody",
  headLook: "timeline.layer.headLook",
  handAdjustment: "timeline.layer.handAdjustment",
  additiveMotion: "timeline.layer.additiveMotion",
  vfxSync: "timeline.layer.vfxSync"
} as const;
