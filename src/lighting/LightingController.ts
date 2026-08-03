import type { MineMotionProject } from "../project/ProjectFile";
import type { Vector3Tuple } from "../core/scene/SceneTypes";
import type { PostProcessingSettings } from "../rendering/postprocessing/PostProcessingTypes";
import type {
  EnvironmentKeyframe,
  EnvironmentKeyframeValues,
  LightingSettings,
  ResolvedLightingState,
  WeatherMode
} from "./LightingTypes";

export function addEnvironmentKeyframe(
  settings: LightingSettings,
  postProcessing: PostProcessingSettings,
  frame: number
): LightingSettings {
  const keyframe: EnvironmentKeyframe = {
    id: `environment_keyframe_${Math.max(0, Math.round(frame))}`,
    frame: Math.max(0, Math.round(frame)),
    interpolation: "linear",
    values: {
      sunIntensity: settings.sunIntensity,
      moonIntensity: settings.moonIntensity,
      ambientIntensity: settings.ambientIntensity,
      fogDensity: settings.fogDensity,
      fogColor: settings.fogColor,
      timeOfDay: settings.timeOfDay,
      weather: settings.weather,
      weatherIntensity: settings.weatherIntensity,
      windSpeed: settings.windSpeed,
      bloomIntensity: postProcessing.bloomIntensity,
      vignetteAmount: postProcessing.vignetteAmount,
      grainAmount: postProcessing.grainAmount,
      chromaticAberrationAmount: postProcessing.chromaticAberrationAmount,
      exposure: postProcessing.exposure,
      contrast: postProcessing.contrast
    }
  };

  return {
    ...settings,
    keyframes: [
      ...settings.keyframes.filter((candidate) => candidate.frame !== keyframe.frame),
      keyframe
    ].sort((left, right) => left.frame - right.frame)
  };
}

export function sampleEnvironmentProject(
  project: MineMotionProject,
  frame: number
): MineMotionProject {
  const values = sampleKeyframeValues(project.lighting.keyframes, frame);
  if (!values) return project;
  return {
    ...project,
    lighting: {
      ...project.lighting,
      sunIntensity: values.sunIntensity,
      moonIntensity: values.moonIntensity,
      ambientIntensity: values.ambientIntensity,
      fogDensity: values.fogDensity,
      fogColor: values.fogColor,
      timeOfDay: values.timeOfDay,
      weather: values.weather,
      weatherIntensity: values.weatherIntensity,
      windSpeed: values.windSpeed
    },
    postProcessing: {
      ...project.postProcessing,
      bloomIntensity: values.bloomIntensity,
      vignetteAmount: values.vignetteAmount,
      grainAmount: values.grainAmount,
      chromaticAberrationAmount: values.chromaticAberrationAmount,
      exposure: values.exposure,
      contrast: values.contrast
    }
  };
}

export function resolveLightingAtFrame(
  settings: LightingSettings,
  frame: number
): ResolvedLightingState {
  const dayLengthFrames = Math.max(1, finite(settings.dayLengthFrames, 1));
  const timeOfDay = settings.animateTimeOfDay
    ? wrap24(settings.timeOfDay + (frame / dayLengthFrames) * 24)
    : wrap24(settings.timeOfDay);
  const angle = (timeOfDay / 24) * Math.PI * 2 - Math.PI / 2;
  const solarDirection: Vector3Tuple = [
    Math.cos(angle) * 0.72,
    Math.sin(angle),
    Math.sin(angle * 0.62) * 0.48
  ];
  const daylightFactor = clamp01((solarDirection[1] + 0.18) / 0.72);
  const moonFactor = 1 - daylightFactor;
  const activeCelestialBody = daylightFactor >= 0.5 ? "sun" : "moon";
  const sunDirection = settings.animateTimeOfDay
    ? solarDirection
    : settings.sunDirection;
  const activeDirection = activeCelestialBody === "sun"
    ? sunDirection
    : normalizeDirection(settings.moonDirection);
  const weatherFogBoost = weatherFogDensity(
    settings.weather,
    settings.weatherIntensity
  );
  const stormDarkening = settings.weather === "storm"
    ? clamp01(settings.weatherIntensity) * 0.58
    : settings.weather === "rain"
      ? clamp01(settings.weatherIntensity) * 0.24
      : 0;
  const baseBackground = skyColorForTime(timeOfDay);

  return {
    ...settings,
    timeOfDay,
    sunDirection: activeDirection,
    sunColor: mixColor(settings.moonColor, settings.sunColor, daylightFactor),
    sunIntensity:
      settings.sunIntensity * daylightFactor +
      settings.moonIntensity * moonFactor,
    ambientIntensity:
      settings.ambientIntensity * (0.38 + daylightFactor * 0.62) *
      (1 - stormDarkening * 0.45),
    fogDensity: Math.min(0.2, settings.fogDensity + weatherFogBoost),
    backgroundColor: mixColor(baseBackground, "#303743", stormDarkening),
    daylightFactor,
    activeCelestialBody
  };
}

export function sampleKeyframeValues(
  keyframes: EnvironmentKeyframe[],
  frame: number
): EnvironmentKeyframeValues | null {
  if (keyframes.length === 0) return null;
  const sorted = [...keyframes].sort((left, right) => left.frame - right.frame);
  const previous = [...sorted].reverse().find((keyframe) => keyframe.frame <= frame) ?? sorted[0];
  const next = sorted.find((keyframe) => keyframe.frame >= frame) ?? sorted[sorted.length - 1];
  if (previous.frame === next.frame || previous.interpolation === "constant") {
    return previous.values;
  }
  const t = clamp01((frame - previous.frame) / (next.frame - previous.frame));
  return {
    sunIntensity: mix(previous.values.sunIntensity, next.values.sunIntensity, t),
    moonIntensity: mix(previous.values.moonIntensity, next.values.moonIntensity, t),
    ambientIntensity: mix(previous.values.ambientIntensity, next.values.ambientIntensity, t),
    fogDensity: mix(previous.values.fogDensity, next.values.fogDensity, t),
    fogColor: mixColor(previous.values.fogColor, next.values.fogColor, t),
    timeOfDay: mix(previous.values.timeOfDay, next.values.timeOfDay, t),
    weather: t < 0.5 ? previous.values.weather : next.values.weather,
    weatherIntensity: mix(previous.values.weatherIntensity, next.values.weatherIntensity, t),
    windSpeed: mix(previous.values.windSpeed, next.values.windSpeed, t),
    bloomIntensity: mix(previous.values.bloomIntensity, next.values.bloomIntensity, t),
    vignetteAmount: mix(previous.values.vignetteAmount, next.values.vignetteAmount, t),
    grainAmount: mix(previous.values.grainAmount, next.values.grainAmount, t),
    chromaticAberrationAmount: mix(
      previous.values.chromaticAberrationAmount,
      next.values.chromaticAberrationAmount,
      t
    ),
    exposure: mix(previous.values.exposure, next.values.exposure, t),
    contrast: mix(previous.values.contrast, next.values.contrast, t)
  };
}

function weatherFogDensity(weather: WeatherMode, intensity: number): number {
  const factor = clamp01(intensity);
  if (weather === "storm") return factor * 0.018;
  if (weather === "rain") return factor * 0.006;
  if (weather === "snow") return factor * 0.004;
  return 0;
}

function skyColorForTime(time: number): string {
  if (time < 5 || time >= 21) return "#0c1024";
  if (time < 7) return mixColor("#18213d", "#f08a62", (time - 5) / 2);
  if (time < 17) return mixColor("#86bfff", "#72b4f5", (time - 7) / 10);
  if (time < 20) return mixColor("#72b4f5", "#ef795b", (time - 17) / 3);
  return mixColor("#ef795b", "#0c1024", time - 20);
}

function normalizeDirection(value: Vector3Tuple): Vector3Tuple {
  const length = Math.hypot(value[0], value[1], value[2]);
  if (!Number.isFinite(length) || length < 0.0001) return [-0.42, 0.72, -0.34];
  return [value[0] / length, value[1] / length, value[2] / length];
}

function mix(left: number, right: number, t: number): number {
  return left + (right - left) * t;
}

function mixColor(left: string, right: string, t: number): string {
  const a = parseHex(left);
  const b = parseHex(right);
  const channels = a.map((channel, index) => Math.round(mix(channel, b[index], clamp01(t))));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function parseHex(value: string): [number, number, number] {
  const normalized = /^#[0-9a-f]{6}$/i.test(value) ? value.slice(1) : "000000";
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16)
  ];
}

function wrap24(value: number): number {
  return ((value % 24) + 24) % 24;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, finite(value, 0)));
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}
