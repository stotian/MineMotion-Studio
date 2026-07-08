import { describe, expect, it } from "vitest";
import { presetRegistry } from "./PresetRegistry";

describe("PresetRegistry", () => {
  it("exposes built-in camera, pose, animation and block palette presets", () => {
    const snapshot = presetRegistry.snapshot();

    expect(snapshot.camera.length).toBeGreaterThanOrEqual(5);
    expect(snapshot.rigPose.length).toBeGreaterThanOrEqual(6);
    expect(snapshot.animation.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.blockPalette.map((preset) => preset.id)).toContain("nether");
  });
});

