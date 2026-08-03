import type { Vector3Tuple } from "../core/scene/SceneTypes";
import type { PostProcessingPresetId } from "../rendering/postprocessing/PostProcessingTypes";
import type { SkyPresetId } from "../renderer/SkyTypes";

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
export type WeatherMode = "clear" | "rain" | "snow" | "storm";

export interface EnvironmentKeyframeValues {
  sunIntensity: number;
  moonIntensity: number;
  ambientIntensity: number;
  fogDensity: number;
  fogColor: string;
  timeOfDay: number;
  weather: WeatherMode;
  weatherIntensity: number;
  windSpeed: number;
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
  moonDirection: Vector3Tuple;
  moonColor: string;
  moonIntensity: number;
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
  weather: WeatherMode;
  weatherIntensity: number;
  weatherSeed: number;
  windDirection: Vector3Tuple;
  windSpeed: number;
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
  daylightFactor: number;
  activeCelestialBody: "sun" | "moon";
}
