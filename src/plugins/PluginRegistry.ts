import type { PluginManifest } from "./PluginManifest";
import { validatePluginManifest } from "./PluginManifest";
import { BuiltinObjImporterPlugin } from "./builtin/BuiltinObjImporterPlugin";
import { BuiltinPresetPlugin } from "./builtin/BuiltinPresetPlugin";
import { BuiltinTemplatePlugin } from "./builtin/BuiltinTemplatePlugin";

export interface RegisteredPlugin {
  manifest: PluginManifest;
  enabled: boolean;
  validationErrors: string[];
}

export class PluginRegistry {
  private readonly plugins = new Map<string, RegisteredPlugin>();

  constructor(manifests: PluginManifest[] = BUILTIN_PLUGIN_MANIFESTS) {
    manifests.forEach((manifest) => this.register(manifest));
  }

  register(manifest: PluginManifest): RegisteredPlugin {
    const registered: RegisteredPlugin = {
      manifest,
      enabled: manifest.enabled,
      validationErrors: validatePluginManifest(manifest)
    };
    this.plugins.set(manifest.id, registered);
    return registered;
  }

  list(): RegisteredPlugin[] {
    return [...this.plugins.values()];
  }

  setEnabled(pluginId: string, enabled: boolean): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;
    this.plugins.set(pluginId, {
      ...plugin,
      enabled
    });
  }
}

export const BUILTIN_PLUGIN_MANIFESTS: PluginManifest[] = [
  BuiltinTemplatePlugin,
  BuiltinPresetPlugin,
  BuiltinObjImporterPlugin
];

export const pluginRegistry = new PluginRegistry();

