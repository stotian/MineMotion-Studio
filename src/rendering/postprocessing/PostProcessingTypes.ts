export type PostProcessingPresetId =
  | "clean-preview"
  | "cinematic-warm"
  | "dark-horror"
  | "nether-heat"
  | "end-void"
  | "anime-impact"
  | "dream-glow"
  | "stormy-contrast"
  | "retro-pixel"
  | "noir";

export interface PostProcessingSettings {
  enabled: boolean;
  presetId: PostProcessingPresetId;
  bloomIntensity: number;
  vignetteAmount: number;
  saturation: number;
  contrast: number;
  brightness: number;
  hueShift: number;
  grainAmount: number;
  chromaticAberrationAmount: number;
  pixelationAmount: number;
  exposure: number;
  fogColor: string;
  fogIntensity: number;
}

export interface PostProcessingPreset {
  id: PostProcessingPresetId;
  name: string;
  description: string;
  settings: PostProcessingSettings;
}
