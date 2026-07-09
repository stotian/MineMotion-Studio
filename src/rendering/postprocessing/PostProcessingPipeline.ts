import type { CSSProperties } from "react";
import type { PostProcessingSettings } from "./PostProcessingTypes";

export interface PostProcessingStyleBundle {
  canvasStyle: CSSProperties;
  overlayStyle: CSSProperties;
  vignetteStyle: CSSProperties;
  grainStyle: CSSProperties;
  chromaticStyle: CSSProperties;
}

export function createPostProcessingStyles(
  settings: PostProcessingSettings
): PostProcessingStyleBundle {
  if (!settings.enabled) {
    return {
      canvasStyle: {},
      overlayStyle: { display: "none" },
      vignetteStyle: { display: "none" },
      grainStyle: { display: "none" },
      chromaticStyle: { display: "none" }
    };
  }

  const brightness = settings.brightness * settings.exposure;
  return {
    canvasStyle: {
      filter: [
        `brightness(${brightness})`,
        `contrast(${settings.contrast})`,
        `saturate(${settings.saturation})`,
        `hue-rotate(${settings.hueShift}deg)`
      ].join(" "),
      imageRendering:
        settings.pixelationAmount > 0.5 ? "pixelated" : "auto"
    },
    overlayStyle: {
      opacity: Math.min(0.65, settings.bloomIntensity * 0.9),
      background:
        "radial-gradient(circle at 50% 38%, rgb(255 255 255 / 52%), transparent 42%)"
    },
    vignetteStyle: {
      opacity: Math.min(0.92, settings.vignetteAmount),
      background:
        "radial-gradient(circle at center, transparent 44%, rgb(0 0 0 / 88%) 100%)"
    },
    grainStyle: {
      opacity: Math.min(0.45, settings.grainAmount),
      backgroundImage:
        "repeating-radial-gradient(circle at 12% 18%, rgb(255 255 255 / 18%) 0 1px, transparent 1px 3px)"
    },
    chromaticStyle: {
      opacity: Math.min(0.36, settings.chromaticAberrationAmount),
      boxShadow:
        "inset 5px 0 0 rgb(255 40 90 / 45%), inset -5px 0 0 rgb(50 170 255 / 45%)"
    }
  };
}
