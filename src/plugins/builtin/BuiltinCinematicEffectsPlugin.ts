import type { PluginManifest } from "../PluginManifest";

export const BuiltinCinematicEffectsPlugin: PluginManifest = {
  id: "minemotion.builtin.cinematic-effects",
  name: "Built-in Cinematic Effects",
  version: "0.4.0",
  minMineMotionVersion: "0.4.0",
  description:
    "Registers bundled cinematic effects, post-processing presets, SFX metadata, render presets, and timeline item types.",
  author: "MineMotion Studio",
  permissions: [
    "registerEffects",
    "registerPostProcessing",
    "registerSfx",
    "registerRenderPresets",
    "registerTimelineItemTypes"
  ],
  entry: "builtin",
  enabled: true,
  builtin: true
};
