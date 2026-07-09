import type {
  PostProcessingPreset,
  PostProcessingPresetId,
  PostProcessingSettings
} from "./PostProcessingTypes";

export const DEFAULT_POST_PROCESSING: PostProcessingSettings = {
  enabled: true,
  presetId: "clean-preview",
  bloomIntensity: 0.05,
  vignetteAmount: 0.18,
  saturation: 1,
  contrast: 1,
  brightness: 1,
  hueShift: 0,
  grainAmount: 0,
  chromaticAberrationAmount: 0,
  pixelationAmount: 0,
  exposure: 1,
  fogColor: "#8aa8c7",
  fogIntensity: 0
};

export const POST_PROCESSING_PRESETS: PostProcessingPreset[] = [
  {
    id: "clean-preview",
    name: "Clean Preview",
    description: "Neutral viewport preview with a light vignette.",
    settings: DEFAULT_POST_PROCESSING
  },
  {
    id: "cinematic-warm",
    name: "Cinematic Warm",
    description: "Warm contrast and soft bloom for sunset shots.",
    settings: {
      ...DEFAULT_POST_PROCESSING,
      presetId: "cinematic-warm",
      bloomIntensity: 0.22,
      vignetteAmount: 0.34,
      saturation: 1.12,
      contrast: 1.14,
      brightness: 1.03,
      hueShift: 8,
      grainAmount: 0.08,
      exposure: 1.08,
      fogColor: "#e4b27a",
      fogIntensity: 0.08
    }
  },
  {
    id: "dark-horror",
    name: "Dark Horror",
    description: "Dark, desaturated contrast for tension.",
    settings: {
      ...DEFAULT_POST_PROCESSING,
      presetId: "dark-horror",
      bloomIntensity: 0.05,
      vignetteAmount: 0.62,
      saturation: 0.62,
      contrast: 1.35,
      brightness: 0.74,
      grainAmount: 0.2,
      exposure: 0.8,
      fogColor: "#1d2430",
      fogIntensity: 0.22
    }
  },
  {
    id: "nether-heat",
    name: "Nether Heat",
    description: "Hot red grade with shimmer-friendly contrast.",
    settings: {
      ...DEFAULT_POST_PROCESSING,
      presetId: "nether-heat",
      bloomIntensity: 0.32,
      vignetteAmount: 0.32,
      saturation: 1.35,
      contrast: 1.18,
      brightness: 0.98,
      hueShift: -12,
      grainAmount: 0.1,
      chromaticAberrationAmount: 0.12,
      exposure: 1.08,
      fogColor: "#b33c2b",
      fogIntensity: 0.2
    }
  },
  {
    id: "end-void",
    name: "End Void",
    description: "Cold purple-blue tone for surreal scenes.",
    settings: {
      ...DEFAULT_POST_PROCESSING,
      presetId: "end-void",
      bloomIntensity: 0.24,
      vignetteAmount: 0.5,
      saturation: 0.82,
      contrast: 1.22,
      brightness: 0.9,
      hueShift: 32,
      chromaticAberrationAmount: 0.08,
      exposure: 0.92,
      fogColor: "#211943",
      fogIntensity: 0.18
    }
  },
  {
    id: "anime-impact",
    name: "Anime Impact",
    description: "Sharp contrast for hit frames and speed lines.",
    settings: {
      ...DEFAULT_POST_PROCESSING,
      presetId: "anime-impact",
      bloomIntensity: 0.12,
      vignetteAmount: 0.12,
      saturation: 1.38,
      contrast: 1.55,
      brightness: 1.12,
      chromaticAberrationAmount: 0.16,
      exposure: 1.2
    }
  },
  {
    id: "dream-glow",
    name: "Dream Glow",
    description: "Soft bright bloom for magical scenes.",
    settings: {
      ...DEFAULT_POST_PROCESSING,
      presetId: "dream-glow",
      bloomIntensity: 0.48,
      vignetteAmount: 0.2,
      saturation: 1.22,
      contrast: 0.92,
      brightness: 1.12,
      hueShift: 16,
      exposure: 1.18,
      fogColor: "#caa9ff",
      fogIntensity: 0.16
    }
  },
  {
    id: "stormy-contrast",
    name: "Stormy Contrast",
    description: "Cold blue grade with contrast and grain.",
    settings: {
      ...DEFAULT_POST_PROCESSING,
      presetId: "stormy-contrast",
      bloomIntensity: 0.1,
      vignetteAmount: 0.42,
      saturation: 0.78,
      contrast: 1.32,
      brightness: 0.86,
      hueShift: 188,
      grainAmount: 0.16,
      exposure: 0.9,
      fogColor: "#536a80",
      fogIntensity: 0.24
    }
  },
  {
    id: "retro-pixel",
    name: "Retro Pixel",
    description: "Pixelated preview with mild chromatic offset.",
    settings: {
      ...DEFAULT_POST_PROCESSING,
      presetId: "retro-pixel",
      bloomIntensity: 0,
      vignetteAmount: 0.26,
      saturation: 1.18,
      contrast: 1.12,
      brightness: 1,
      grainAmount: 0.18,
      chromaticAberrationAmount: 0.1,
      pixelationAmount: 1,
      exposure: 1
    }
  },
  {
    id: "noir",
    name: "Noir",
    description: "Black-and-white high contrast framing.",
    settings: {
      ...DEFAULT_POST_PROCESSING,
      presetId: "noir",
      bloomIntensity: 0.04,
      vignetteAmount: 0.56,
      saturation: 0,
      contrast: 1.42,
      brightness: 0.9,
      grainAmount: 0.24,
      exposure: 0.95
    }
  }
];

export function getPostProcessingPreset(
  presetId: PostProcessingPresetId
): PostProcessingPreset {
  return (
    POST_PROCESSING_PRESETS.find((preset) => preset.id === presetId) ??
    POST_PROCESSING_PRESETS[0]
  );
}

export function withPostProcessingDefaults(
  settings: Partial<PostProcessingSettings> | undefined
): PostProcessingSettings {
  return {
    ...DEFAULT_POST_PROCESSING,
    ...settings,
    presetId: settings?.presetId ?? DEFAULT_POST_PROCESSING.presetId
  };
}
