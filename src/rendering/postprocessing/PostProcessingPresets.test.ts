import { describe, expect, it } from "vitest";
import {
  getPostProcessingPreset,
  POST_PROCESSING_PRESETS,
  withPostProcessingDefaults
} from "./PostProcessingPresets";

describe("PostProcessingPresets", () => {
  it("exposes professional post presets", () => {
    expect(POST_PROCESSING_PRESETS.map((preset) => preset.id)).toContain(
      "anime-impact"
    );
    expect(getPostProcessingPreset("noir").settings.saturation).toBe(0);
  });

  it("fills missing post settings with defaults", () => {
    const settings = withPostProcessingDefaults({
      contrast: 1.4
    });

    expect(settings.enabled).toBe(true);
    expect(settings.contrast).toBe(1.4);
    expect(settings.presetId).toBe("clean-preview");
  });
});
