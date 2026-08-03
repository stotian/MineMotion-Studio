import { createId } from "../../core/ids/Id";
import { getLightingMoodPreset } from "../../lighting/LightingPresets";
import type { EnvironmentKeyframe, EnvironmentKeyframeValues, LightingMoodPresetId } from "../../lighting/LightingTypes";
import type { MineMotionProject } from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import { getPostProcessingPreset } from "../../rendering/postprocessing/PostProcessingPresets";

export const ENVIRONMENT_TRANSITION_KINDS = [
  "day-to-night",
  "clear-to-storm",
  "fog-roll-in",
  "sunrise",
  "nether-surge",
  "end-corruption"
] as const;
export type EnvironmentTransitionKind = (typeof ENVIRONMENT_TRANSITION_KINDS)[number];

export interface EnvironmentTransitionResult {
  project: MineMotionProject;
  changed: boolean;
  kind: EnvironmentTransitionKind;
  keyframeIds: string[];
  error: string | null;
}

export function createEnvironmentTransition(
  project: MineMotionProject,
  kind: EnvironmentTransitionKind,
  startFrame = project.animation.currentFrame,
  durationFrames = project.animation.fps * 4
): EnvironmentTransitionResult {
  const start = Math.max(0, Math.round(startFrame));
  const duration = Math.max(4, Math.round(durationFrames));
  const end = start + duration;
  const source = valuesFromProject(project);
  const targetPreset = getLightingMoodPreset(targetPresetFor(kind));
  const targetPost = getPostProcessingPreset(targetPreset.postPresetId).settings;
  let target = valuesFromPreset(targetPreset.settings, targetPost);
  let skyPreset = targetPreset.skyPresetId;
  if (kind === "day-to-night") target = { ...target, timeOfDay: 23, weather: "clear", weatherIntensity: 0 };
  if (kind === "clear-to-storm") target = { ...target, weather: "storm", weatherIntensity: 0.92, windSpeed: 2.8 };
  if (kind === "fog-roll-in") target = { ...source, fogDensity: Math.max(0.035, source.fogDensity * 5), fogColor: "#30383f", vignetteAmount: Math.max(0.5, source.vignetteAmount), contrast: Math.max(1.25, source.contrast) };
  if (kind === "sunrise") target = { ...target, timeOfDay: 7.2, weather: "clear", weatherIntensity: 0, exposure: Math.max(1.05, target.exposure) };
  if (kind === "nether-surge") target = { ...target, weather: "clear", weatherIntensity: 0, bloomIntensity: Math.max(0.35, target.bloomIntensity), windSpeed: 1.4 };
  if (kind === "end-corruption") target = { ...target, timeOfDay: 21, fogDensity: Math.max(0.018, target.fogDensity), chromaticAberrationAmount: Math.max(0.14, target.chromaticAberrationAmount) };
  if (kind === "fog-roll-in") skyPreset = project.sky.preset;

  const middle: EnvironmentKeyframeValues = {
    ...source,
    fogDensity: (source.fogDensity + target.fogDensity) / 2,
    weather: kind === "clear-to-storm" ? "rain" : source.weather,
    weatherIntensity: (source.weatherIntensity + target.weatherIntensity) / 2,
    windSpeed: (source.windSpeed + target.windSpeed) / 2,
    bloomIntensity: (source.bloomIntensity + target.bloomIntensity) / 2,
    vignetteAmount: (source.vignetteAmount + target.vignetteAmount) / 2,
    grainAmount: (source.grainAmount + target.grainAmount) / 2,
    chromaticAberrationAmount: (source.chromaticAberrationAmount + target.chromaticAberrationAmount) / 2,
    exposure: (source.exposure + target.exposure) / 2,
    contrast: (source.contrast + target.contrast) / 2,
    timeOfDay: interpolateClock(source.timeOfDay, target.timeOfDay, 0.5),
    sunIntensity: (source.sunIntensity + target.sunIntensity) / 2,
    moonIntensity: (source.moonIntensity + target.moonIntensity) / 2,
    ambientIntensity: (source.ambientIntensity + target.ambientIntensity) / 2,
    fogColor: source.fogColor
  };
  const keyframes: EnvironmentKeyframe[] = [
    keyframe(start, source),
    keyframe(start + Math.round(duration * 0.5), middle),
    keyframe(end, target)
  ];
  const replacedFrames = new Set(keyframes.map((entry) => entry.frame));
  const allKeyframes = [
    ...project.lighting.keyframes.filter((entry) => !replacedFrames.has(entry.frame)),
    ...keyframes
  ].sort((a, b) => a.frame - b.frame);
  const next = syncCinematicTimeline({
    ...project,
    sky: { ...project.sky, preset: skyPreset },
    lighting: {
      ...project.lighting,
      presetId: targetPreset.id,
      keyframes: allKeyframes
    },
    projectSettings: { ...project.projectSettings, durationFrames: Math.max(project.projectSettings.durationFrames, end) },
    animation: { ...project.animation, durationFrames: Math.max(project.animation.durationFrames, end) },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  });
  return { project: next, changed: true, kind, keyframeIds: keyframes.map((entry) => entry.id), error: null };
}

function valuesFromProject(project: MineMotionProject): EnvironmentKeyframeValues {
  return {
    sunIntensity: project.lighting.sunIntensity,
    moonIntensity: project.lighting.moonIntensity,
    ambientIntensity: project.lighting.ambientIntensity,
    fogDensity: project.lighting.fogDensity,
    fogColor: project.lighting.fogColor,
    timeOfDay: project.lighting.timeOfDay,
    weather: project.lighting.weather,
    weatherIntensity: project.lighting.weatherIntensity,
    windSpeed: project.lighting.windSpeed,
    bloomIntensity: project.postProcessing.bloomIntensity,
    vignetteAmount: project.postProcessing.vignetteAmount,
    grainAmount: project.postProcessing.grainAmount,
    chromaticAberrationAmount: project.postProcessing.chromaticAberrationAmount,
    exposure: project.postProcessing.exposure,
    contrast: project.postProcessing.contrast
  };
}

function valuesFromPreset(
  lighting: ReturnType<typeof getLightingMoodPreset>["settings"],
  post: ReturnType<typeof getPostProcessingPreset>["settings"]
): EnvironmentKeyframeValues {
  return {
    sunIntensity: lighting.sunIntensity,
    moonIntensity: lighting.moonIntensity,
    ambientIntensity: lighting.ambientIntensity,
    fogDensity: lighting.fogDensity,
    fogColor: lighting.fogColor,
    timeOfDay: lighting.timeOfDay,
    weather: lighting.weather,
    weatherIntensity: lighting.weatherIntensity,
    windSpeed: lighting.windSpeed,
    bloomIntensity: post.bloomIntensity,
    vignetteAmount: post.vignetteAmount,
    grainAmount: post.grainAmount,
    chromaticAberrationAmount: post.chromaticAberrationAmount,
    exposure: post.exposure,
    contrast: post.contrast
  };
}

function targetPresetFor(kind: EnvironmentTransitionKind): LightingMoodPresetId {
  if (kind === "day-to-night") return "moonlit-night";
  if (kind === "clear-to-storm") return "storm-fight";
  if (kind === "fog-roll-in") return "horror-fog";
  if (kind === "sunrise") return "golden-hour";
  if (kind === "nether-surge") return "nether-heat";
  return "end-void";
}

function keyframe(frame: number, values: EnvironmentKeyframeValues): EnvironmentKeyframe {
  return { id: createId("director-environment"), frame, interpolation: "linear", values };
}

function interpolateClock(start: number, end: number, t: number): number {
  let delta = end - start;
  if (delta > 12) delta -= 24;
  if (delta < -12) delta += 24;
  return ((start + delta * t) % 24 + 24) % 24;
}
