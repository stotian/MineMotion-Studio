import type { PluginManifest } from "../PluginManifest";

export const BuiltinObjImporterPlugin: PluginManifest = {
  id: "minemotion.builtin.obj-importer",
  name: "Built-in OBJ Importer",
  version: "0.4.0",
  minMineMotionVersion: "0.4.0",
  description: "Registers the Phase 1 OBJ importer.",
  author: "MineMotion Studio",
  permissions: ["registerImporters"],
  entry: "builtin",
  enabled: true,
  builtin: true
};
