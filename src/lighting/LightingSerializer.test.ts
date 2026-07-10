import { describe, expect, it } from "vitest";
import { addEnvironmentKeyframe, resolveLightingAtFrame } from "./LightingController";
import {
  DEFAULT_LIGHTING_SETTINGS,
  LIGHTING_MOOD_PRESETS
} from "./LightingPresets";
import { LightingSerializer } from "./LightingSerializer";
import { DEFAULT_POST_PROCESSING } from "../rendering/postprocessing/PostProcessingPresets";

describe("LightingSerializer", () => {
  it("serializes a lighting preset with environment keyframes", () => {
    const settings = addEnvironmentKeyframe(
      DEFAULT_LIGHTING_SETTINGS,
      DEFAULT_POST_PROCESSING,
      48
    );
    const parsed = LightingSerializer.parse(LightingSerializer.serialize(settings));

    expect(parsed.presetId).toBe("clear-day");
    expect(parsed.keyframes[0].frame).toBe(48);
    expect(parsed.keyframes[0].values.exposure).toBe(1);
  });

  it("clamps unsafe numeric values during parsing", () => {
    const parsed = LightingSerializer.parse(
      JSON.stringify({ sunIntensity: -5, fogDensity: 2, dayLengthFrames: 0 })
    );

    expect(parsed.sunIntensity).toBe(0);
    expect(parsed.fogDensity).toBe(0.2);
    expect(parsed.dayLengthFrames).toBe(1);
  });

  it("contains all requested mood presets", () => {
    expect(LIGHTING_MOOD_PRESETS.map((preset) => preset.name)).toEqual([
      "Clear Day",
      "Golden Hour",
      "Moonlit Night",
      "Horror Fog",
      "Nether Heat",
      "End Void",
      "Storm Fight",
      "Anime Impact Lighting"
    ]);
  });

  it("animates sun direction when time-of-day animation is enabled", () => {
    const resolved = resolveLightingAtFrame(
      {
        ...DEFAULT_LIGHTING_SETTINGS,
        animateTimeOfDay: true,
        dayLengthFrames: 240
      },
      120
    );

    expect(resolved.timeOfDay).toBe(0);
    expect(resolved.sunDirection).not.toEqual(DEFAULT_LIGHTING_SETTINGS.sunDirection);
  });
});
