import { describe, expect, it } from "vitest";
import { validatePluginManifest } from "./PluginManifest";
import { PluginRegistry } from "./PluginRegistry";

describe("PluginRegistry", () => {
  it("validates plugin manifests", () => {
    const errors = validatePluginManifest({
      id: "example.camera.presets",
      name: "Example Camera Presets",
      version: "0.1.0",
      minMineMotionVersion: "0.1.0",
      description: "Adds camera presets.",
      author: "Unknown",
      permissions: ["registerPresets"],
      entry: "plugin.js",
      enabled: true
    });

    expect(errors).toEqual([]);
  });

  it("toggles built-in plugin enabled state", () => {
    const registry = new PluginRegistry();
    registry.setEnabled("minemotion.builtin.templates", false);

    expect(
      registry
        .list()
        .find((plugin) => plugin.manifest.id === "minemotion.builtin.templates")
        ?.enabled
    ).toBe(false);
  });
});

