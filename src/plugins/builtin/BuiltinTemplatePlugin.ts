import type { PluginManifest } from "../PluginManifest";

export const BuiltinTemplatePlugin: PluginManifest = {
  id: "minemotion.builtin.templates",
  name: "Built-in Templates",
  version: "0.1.5",
  minMineMotionVersion: "0.1.5",
  description: "Registers starter scene templates bundled with MineMotion Studio.",
  author: "MineMotion Studio",
  permissions: ["registerTemplates"],
  entry: "builtin",
  enabled: true,
  builtin: true
};

