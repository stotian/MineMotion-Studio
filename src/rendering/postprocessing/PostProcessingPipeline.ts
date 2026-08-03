import type { CSSProperties } from "react";
import type { PostProcessingSettings } from "./PostProcessingTypes";
import { createPostProcessingPlan, getPostOperation } from "./PostProcessingPlan";

export interface PostProcessingStyleBundle {
  canvasStyle: CSSProperties;
  overlayStyle: CSSProperties;
  vignetteStyle: CSSProperties;
  grainStyle: CSSProperties;
  chromaticStyle: CSSProperties;
}

export function createPostProcessingStyles(settings: PostProcessingSettings): PostProcessingStyleBundle {
  const plan = createPostProcessingPlan(settings, "draft");
  if (!plan.enabled) {
    return {
      canvasStyle: {}, overlayStyle: { display: "none" }, vignetteStyle: { display: "none" }, grainStyle: { display: "none" }, chromaticStyle: { display: "none" }
    };
  }
  const bloom = getPostOperation(plan, "bloom");
  const vignette = getPostOperation(plan, "vignette");
  const grain = getPostOperation(plan, "grain");
  const chromatic = getPostOperation(plan, "chromatic");
  const pixelate = getPostOperation(plan, "pixelate");
  return {
    canvasStyle: { filter: plan.cssFilter, imageRendering: pixelate.enabled && pixelate.amount > 0.5 ? "pixelated" : "auto" },
    overlayStyle: bloom.enabled ? { opacity: Math.min(0.65, bloom.amount * 0.9), background: "radial-gradient(circle at 50% 38%, rgb(255 255 255 / 52%), transparent 42%)" } : { display: "none" },
    vignetteStyle: vignette.enabled ? { opacity: Math.min(0.92, vignette.amount), background: "radial-gradient(circle at center, transparent 44%, rgb(0 0 0 / 88%) 100%)" } : { display: "none" },
    grainStyle: grain.enabled ? { opacity: Math.min(0.45, grain.amount), backgroundImage: "repeating-radial-gradient(circle at 12% 18%, rgb(255 255 255 / 18%) 0 1px, transparent 1px 3px)" } : { display: "none" },
    chromaticStyle: chromatic.enabled ? { opacity: Math.min(0.36, chromatic.amount), boxShadow: "inset 5px 0 0 rgb(255 40 90 / 45%), inset -5px 0 0 rgb(50 170 255 / 45%)" } : { display: "none" }
  };
}
