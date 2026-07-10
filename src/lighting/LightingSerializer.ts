import type {
  EnvironmentKeyframe,
  EnvironmentKeyframeValues,
  LightingMoodPresetId,
  LightingSettings
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
  const direction = Array.isArray(value?.sunDirection) && value.sunDirection.length === 3
    ? value.sunDirection.map((component) => finite(component, 0)) as [number, number, number]
    : [...preset.sunDirection] as [number, number, number];

  return {
    ...preset,
    ...value,
    presetId,
    sunDirection: direction,
    sunColor: color(value?.sunColor, preset.sunColor),
    sunIntensity: clamp(value?.sunIntensity, 0, 8, preset.sunIntensity),
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
    ambientIntensity: clamp(record.ambientIntensity, 0, 4, DEFAULT_LIGHTING_SETTINGS.ambientIntensity),
    fogDensity: clamp(record.fogDensity, 0, 0.2, DEFAULT_LIGHTING_SETTINGS.fogDensity),
    fogColor: color(record.fogColor, DEFAULT_LIGHTING_SETTINGS.fogColor),
    timeOfDay: wrap24(finite(record.timeOfDay, DEFAULT_LIGHTING_SETTINGS.timeOfDay)),
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
