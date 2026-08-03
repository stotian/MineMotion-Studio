import type { Vector3Tuple } from "../core/scene/SceneTypes";
import type {
  EnvironmentKeyframe,
  EnvironmentKeyframeValues,
  LightingMoodPresetId,
  LightingSettings,
  WeatherMode
} from "./LightingTypes";
import { DEFAULT_LIGHTING_SETTINGS, getLightingMoodPreset } from "./LightingPresets";

export class LightingSerializer {
  static serialize(settings: LightingSettings): string {
    return JSON.stringify(withLightingDefaults(settings), null, 2);
  }

  static parse(raw: string): LightingSettings {
    return withLightingDefaults(JSON.parse(raw) as Partial<LightingSettings>);
  }
}

export function withLightingDefaults(
  value: Partial<LightingSettings> | undefined
): LightingSettings {
  const presetId = isMoodPresetId(value?.presetId)
    ? value.presetId
    : DEFAULT_LIGHTING_SETTINGS.presetId;
  const preset = getLightingMoodPreset(presetId).settings;

  return {
    ...preset,
    ...value,
    presetId,
    sunDirection: vector(value?.sunDirection, preset.sunDirection),
    sunColor: color(value?.sunColor, preset.sunColor),
    sunIntensity: clamp(value?.sunIntensity, 0, 8, preset.sunIntensity),
    moonDirection: vector(value?.moonDirection, preset.moonDirection),
    moonColor: color(value?.moonColor, preset.moonColor),
    moonIntensity: clamp(value?.moonIntensity, 0, 8, preset.moonIntensity),
    ambientColor: color(value?.ambientColor, preset.ambientColor),
    ambientIntensity: clamp(value?.ambientIntensity, 0, 4, preset.ambientIntensity),
    shadowsEnabled: value?.shadowsEnabled ?? preset.shadowsEnabled,
    fogColor: color(value?.fogColor, preset.fogColor),
    fogDensity: clamp(value?.fogDensity, 0, 0.2, preset.fogDensity),
    fogNear: clamp(value?.fogNear, 0, 10000, preset.fogNear),
    fogFar: clamp(value?.fogFar, 1, 10000, preset.fogFar),
    timeOfDay: wrap24(value?.timeOfDay ?? preset.timeOfDay),
    animateTimeOfDay: value?.animateTimeOfDay ?? preset.animateTimeOfDay,
    dayLengthFrames: Math.max(1, Math.round(finite(value?.dayLengthFrames, preset.dayLengthFrames))),
    weather: weather(value?.weather, preset.weather),
    weatherIntensity: clamp(value?.weatherIntensity, 0, 1, preset.weatherIntensity),
    weatherSeed: Math.trunc(clamp(value?.weatherSeed, -2_147_483_648, 2_147_483_647, preset.weatherSeed)),
    windDirection: vector(value?.windDirection, preset.windDirection),
    windSpeed: clamp(value?.windSpeed, 0, 8, preset.windSpeed),
    keyframes: sanitizeKeyframes(value?.keyframes)
  };
}

function sanitizeKeyframes(value: unknown): EnvironmentKeyframe[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((keyframe, index) => ({
      id: typeof keyframe.id === "string" ? keyframe.id : `environment_keyframe_${index}`,
      frame: Math.max(0, Math.round(finite(keyframe.frame, 0))),
      interpolation: keyframe.interpolation === "constant" ? "constant" as const : "linear" as const,
      values: sanitizeValues(keyframe.values)
    }))
    .sort((left, right) => left.frame - right.frame);
}

function sanitizeValues(value: unknown): EnvironmentKeyframeValues {
  const record = isRecord(value) ? value : {};
  return {
    sunIntensity: clamp(record.sunIntensity, 0, 8, DEFAULT_LIGHTING_SETTINGS.sunIntensity),
    moonIntensity: clamp(record.moonIntensity, 0, 8, DEFAULT_LIGHTING_SETTINGS.moonIntensity),
    ambientIntensity: clamp(record.ambientIntensity, 0, 4, DEFAULT_LIGHTING_SETTINGS.ambientIntensity),
    fogDensity: clamp(record.fogDensity, 0, 0.2, DEFAULT_LIGHTING_SETTINGS.fogDensity),
    fogColor: color(record.fogColor, DEFAULT_LIGHTING_SETTINGS.fogColor),
    timeOfDay: wrap24(finite(record.timeOfDay, DEFAULT_LIGHTING_SETTINGS.timeOfDay)),
    weather: weather(record.weather, DEFAULT_LIGHTING_SETTINGS.weather),
    weatherIntensity: clamp(record.weatherIntensity, 0, 1, DEFAULT_LIGHTING_SETTINGS.weatherIntensity),
    windSpeed: clamp(record.windSpeed, 0, 8, DEFAULT_LIGHTING_SETTINGS.windSpeed),
    bloomIntensity: clamp(record.bloomIntensity, 0, 2, 0.05),
    vignetteAmount: clamp(record.vignetteAmount, 0, 1, 0.18),
    grainAmount: clamp(record.grainAmount, 0, 1, 0),
    chromaticAberrationAmount: clamp(record.chromaticAberrationAmount, 0, 1, 0),
    exposure: clamp(record.exposure, 0.1, 4, 1),
    contrast: clamp(record.contrast, 0.1, 4, 1)
  };
}

function isMoodPresetId(value: unknown): value is LightingMoodPresetId {
  return typeof value === "string" && [
    "clear-day",
    "golden-hour",
    "moonlit-night",
    "horror-fog",
    "nether-heat",
    "end-void",
    "storm-fight",
    "anime-impact-lighting"
  ].includes(value);
}

function weather(value: unknown, fallback: WeatherMode): WeatherMode {
  return value === "rain" || value === "snow" || value === "storm" || value === "clear"
    ? value
    : fallback;
}

function vector(value: unknown, fallback: Vector3Tuple): Vector3Tuple {
  if (!Array.isArray(value) || value.length !== 3) return [...fallback];
  return [
    finite(value[0], fallback[0]),
    finite(value[1], fallback[1]),
    finite(value[2], fallback[2])
  ];
}

function color(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  return Math.min(max, Math.max(min, finite(value, fallback)));
}

function finite(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function wrap24(value: number): number {
  return ((value % 24) + 24) % 24;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
