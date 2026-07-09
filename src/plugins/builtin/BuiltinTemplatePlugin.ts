import type { PluginManifest } from "../PluginManifest";

export const BuiltinTemplatePlugin: PluginManifest = {
  id: "minemotion.builtin.templates",
  name: "Built-in Templates",
  version: "0.3.0",
  minMineMotionVersion: "0.3.0",
  description: "Registers starter scene templates bundled with MineMotion Studio.",
  author: "MineMotion Studio",
  permissions: ["registerTemplates"],
  entry: "builtin",
  enabled: true,
  builtin: true
};
