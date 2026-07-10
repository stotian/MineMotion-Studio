import { describe, expect, it } from "vitest";
import { MaterialPresetSerializer } from "./MaterialPresetSerializer";
import {
  getEmissivePlaceholderPreset,
  getMaterialPresetForBlock
} from "./MinecraftMaterialPresets";

describe("MaterialPresetSerializer", () => {
  it("round-trips material settings and block overrides", () => {
    const parsed = MaterialPresetSerializer.parse(
      MaterialPresetSerializer.serialize({
        defaultPresetId: "solid",
        overrides: {
          stone: "glowstone-emissive"
        }
      })
    );

    expect(parsed.overrides.stone).toBe("glowstone-emissive");
    expect(getMaterialPresetForBlock("stone", parsed).emissiveIntensity).toBeGreaterThan(0);
  });

  it("falls back from unknown serialized preset ids", () => {
    const parsed = MaterialPresetSerializer.parse(
      JSON.stringify({ defaultPresetId: "not-real", overrides: { dirt: "invalid" } })
    );

    expect(parsed.defaultPresetId).toBe("solid");
    expect(parsed.overrides).toEqual({});
  });

  it("exposes the requested emissive block placeholders", () => {
    expect(getEmissivePlaceholderPreset("torch").emissiveIntensity).toBeGreaterThan(1);
    expect(getEmissivePlaceholderPreset("lava").emissiveColor).toBe("#ff5a1f");
  });
});
