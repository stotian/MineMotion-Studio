import type { PluginManifest } from "./PluginManifest";

export class PluginLoader {
  static async readExternalManifest(file: File): Promise<PluginManifest> {
    const manifest = JSON.parse(await file.text()) as PluginManifest;
    return {
      ...manifest,
      enabled: false,
      builtin: false
    };
  }

  static externalCodeExecutionStatus(): string {
    return "External plugin JavaScript execution is disabled in Phase 2. Only manifests and built-in extension points can be inspected.";
  }
}
