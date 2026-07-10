import type { Vector3Tuple } from "../project/ProjectFile";
import type { PostProcessingPresetId } from "../rendering/postprocessing/PostProcessingTypes";
import type { SkyPresetId } from "../renderer/SkySystem";

export type LightingMoodPresetId =
  | "clear-day"
  | "golden-hour"
  | "moonlit-night"
  | "horror-fog"
  | "nether-heat"
  | "end-void"
  | "storm-fight"
  | "anime-impact-lighting";

export type EnvironmentInterpolation = "constant" | "linear";

export interface EnvironmentKeyframeValues {
  sunIntensity: number;
  ambientIntensity: number;
  fogDensity: number;
  fogColor: string;
  timeOfDay: number;
  bloomIntensity: number;
  vignetteAmount: number;
  grainAmount: number;
  chromaticAberrationAmount: number;
  exposure: number;
  contrast: number;
}

export interface EnvironmentKeyframe {
  id: string;
  frame: number;
  interpolation: EnvironmentInterpolation;
  values: EnvironmentKeyframeValues;
}

export interface LightingSettings {
  presetId: LightingMoodPresetId;
  sunDirection: Vector3Tuple;
  sunColor: string;
  sunIntensity: number;
  ambientColor: string;
  ambientIntensity: number;
  shadowsEnabled: boolean;
  fogColor: string;
  fogDensity: number;
  fogNear: number;
  fogFar: number;
  timeOfDay: number;
  animateTimeOfDay: boolean;
  dayLengthFrames: number;
  keyframes: EnvironmentKeyframe[];
}

export interface LightingMoodPreset {
  id: LightingMoodPresetId;
  name: string;
  description: string;
  skyPresetId: SkyPresetId;
  postPresetId: PostProcessingPresetId;
  settings: LightingSettings;
}

export interface ResolvedLightingState extends LightingSettings {
  backgroundColor: string;
}
