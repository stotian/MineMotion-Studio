import type { MineMotionProject } from "../project/ProjectFile";
import type { PostProcessingSettings } from "../rendering/postprocessing/PostProcessingTypes";
import type {
  EnvironmentKeyframe,
  EnvironmentKeyframeValues,
  LightingSettings,
  ResolvedLightingState
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
      ambientIntensity: settings.ambientIntensity,
      fogDensity: settings.fogDensity,
      fogColor: settings.fogColor,
      timeOfDay: settings.timeOfDay,
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
      ambientIntensity: values.ambientIntensity,
      fogDensity: values.fogDensity,
      fogColor: values.fogColor,
      timeOfDay: values.timeOfDay
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
  const timeOfDay = settings.animateTimeOfDay
    ? wrap24(settings.timeOfDay + (frame / settings.dayLengthFrames) * 24)
    : settings.timeOfDay;
  const angle = (timeOfDay / 24) * Math.PI * 2 - Math.PI / 2;
  const animatedDirection: [number, number, number] = [
    Math.cos(angle) * 0.72,
    Math.max(-0.25, Math.sin(angle)),
    Math.sin(angle * 0.62) * 0.48
  ];
  const daylight = Math.max(0.08, Math.sin(angle) * 0.92 + 0.18);

  return {
    ...settings,
    timeOfDay,
    sunDirection: settings.animateTimeOfDay ? animatedDirection : settings.sunDirection,
    sunIntensity: settings.animateTimeOfDay
      ? settings.sunIntensity * daylight
      : settings.sunIntensity,
    ambientIntensity: settings.animateTimeOfDay
      ? settings.ambientIntensity * Math.max(0.32, daylight)
      : settings.ambientIntensity,
    backgroundColor: skyColorForTime(timeOfDay)
  };
}

function sampleKeyframeValues(
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
  const t = Math.min(1, Math.max(0, (frame - previous.frame) / (next.frame - previous.frame)));
  return {
    sunIntensity: mix(previous.values.sunIntensity, next.values.sunIntensity, t),
    ambientIntensity: mix(previous.values.ambientIntensity, next.values.ambientIntensity, t),
    fogDensity: mix(previous.values.fogDensity, next.values.fogDensity, t),
    fogColor: mixColor(previous.values.fogColor, next.values.fogColor, t),
    timeOfDay: mix(previous.values.timeOfDay, next.values.timeOfDay, t),
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

function skyColorForTime(time: number): string {
  if (time < 5 || time >= 21) return "#0c1024";
  if (time < 7) return mixColor("#18213d", "#f08a62", (time - 5) / 2);
  if (time < 17) return mixColor("#86bfff", "#72b4f5", (time - 7) / 10);
  if (time < 20) return mixColor("#72b4f5", "#ef795b", (time - 17) / 3);
  return mixColor("#ef795b", "#0c1024", time - 20);
}

function mix(left: number, right: number, t: number): number {
  return left + (right - left) * t;
}

function mixColor(left: string, right: string, t: number): string {
  const a = parseHex(left);
  const b = parseHex(right);
  const channels = a.map((channel, index) => Math.round(mix(channel, b[index], t)));
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
