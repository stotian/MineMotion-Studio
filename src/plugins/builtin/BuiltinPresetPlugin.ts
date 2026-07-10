import type { PluginManifest } from "../PluginManifest";

export const BuiltinPresetPlugin: PluginManifest = {
  id: "minemotion.builtin.presets",
  name: "Built-in Presets",
  version: "0.8.0",
  minMineMotionVersion: "0.8.0",
  description: "Registers bundled camera, rig pose, animation, sky, and block palette presets.",
  author: "MineMotion Studio",
  permissions: ["registerPresets"],
  entry: "builtin",
  enabled: true,
  builtin: true
};
