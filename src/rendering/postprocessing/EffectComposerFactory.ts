import type { PostProcessingSettings } from "./PostProcessingTypes";

export function describeComposerStrategy(
  settings: PostProcessingSettings
): string {
  if (!settings.enabled) {
    return "Post-processing disabled.";
  }

  return "CSS/WebGL-safe overlay pipeline active. EffectComposer integration is reserved for a later native render/export phase.";
}
