import type { MineMotionProject } from "../../project/ProjectFile";
import { getPostProcessingPreset, POST_PROCESSING_PRESETS, withPostProcessingDefaults } from "../../rendering/postprocessing/PostProcessingPresets";
import type { PostProcessingPresetId, PostProcessingSettings } from "../../rendering/postprocessing/PostProcessingTypes";
import type { PostStackLayer } from "./MinecraftStudioTypes";

export const STUDIO_FINISH_IDS = [
  "clean-film", "golden-hour", "moonlight", "deep-cave", "nether-cinema", "end-dream",
  "horror-grain", "anime-battle", "soft-fantasy", "documentary", "music-video", "retro-adventure",
  "icy-storm", "warm-village", "boss-reveal", "high-contrast-trailer"
] as const;
export type StudioFinishId = (typeof STUDIO_FINISH_IDS)[number];

export interface StudioFinishRecipe {
  id: StudioFinishId;
  name: string;
  description: string;
  basePresetId: PostProcessingPresetId;
  overrides: Partial<PostProcessingSettings>;
}

export const STUDIO_FINISH_RECIPES: readonly StudioFinishRecipe[] = [
  finish("clean-film", "Clean film", "Neutral cinematic image with subtle bloom and grain.", "clean-preview", { bloomIntensity: 0.12, vignetteAmount: 0.24, contrast: 1.08, grainAmount: 0.045, exposure: 1.02 }),
  finish("golden-hour", "Golden hour", "Warm outdoor grade with soft atmospheric depth.", "cinematic-warm", { bloomIntensity: 0.28, saturation: 1.16, hueShift: 10, fogColor: "#e8bd83", fogIntensity: 0.11 }),
  finish("moonlight", "Moonlight", "Cool moonlit contrast without crushing character detail.", "stormy-contrast", { hueShift: 205, saturation: 0.74, brightness: 0.86, exposure: 0.95, fogColor: "#536b92", fogIntensity: 0.16 }),
  finish("deep-cave", "Deep cave", "Low-key cave finish with focused highlights.", "dark-horror", { bloomIntensity: 0.12, brightness: 0.72, vignetteAmount: 0.54, fogColor: "#151b20", fogIntensity: 0.18 }),
  finish("nether-cinema", "Nether cinema", "Controlled red-orange heat with readable blacks.", "nether-heat", { bloomIntensity: 0.36, saturation: 1.28, contrast: 1.24, chromaticAberrationAmount: 0.08, fogIntensity: 0.23 }),
  finish("end-dream", "End dream", "Purple surreal finish for End and portal scenes.", "end-void", { bloomIntensity: 0.34, brightness: 0.96, hueShift: 42, fogColor: "#392460", fogIntensity: 0.21 }),
  finish("horror-grain", "Horror grain", "Heavy vignette, grain and desaturation for horror.", "dark-horror", { grainAmount: 0.3, saturation: 0.45, contrast: 1.42, vignetteAmount: 0.7, chromaticAberrationAmount: 0.06 }),
  finish("anime-battle", "Anime battle", "Punchy saturation and impact-friendly contrast.", "anime-impact", { bloomIntensity: 0.18, saturation: 1.45, contrast: 1.62, exposure: 1.16, chromaticAberrationAmount: 0.14 }),
  finish("soft-fantasy", "Soft fantasy", "Bright magical atmosphere with gentle color separation.", "dream-glow", { bloomIntensity: 0.56, contrast: 0.9, brightness: 1.15, fogIntensity: 0.19, grainAmount: 0.035 }),
  finish("documentary", "Documentary", "Natural color and restrained post effects.", "clean-preview", { bloomIntensity: 0.04, vignetteAmount: 0.12, contrast: 1.04, grainAmount: 0.02, chromaticAberrationAmount: 0 }),
  finish("music-video", "Music video", "Bold color, bloom and chromatic energy.", "anime-impact", { bloomIntensity: 0.4, saturation: 1.5, hueShift: 18, chromaticAberrationAmount: 0.2, grainAmount: 0.1 }),
  finish("retro-adventure", "Retro adventure", "Pixel-art flavored grade for nostalgic sequences.", "retro-pixel", { pixelationAmount: 0.65, saturation: 1.24, grainAmount: 0.16, contrast: 1.18 }),
  finish("icy-storm", "Icy storm", "Cold high-contrast atmosphere for snow and storms.", "stormy-contrast", { hueShift: 195, saturation: 0.82, contrast: 1.38, fogColor: "#b5d9ef", fogIntensity: 0.3 }),
  finish("warm-village", "Warm village", "Comfortable warm grade for interiors and dialogue.", "cinematic-warm", { bloomIntensity: 0.2, saturation: 1.08, contrast: 1.06, hueShift: 7, grainAmount: 0.04 }),
  finish("boss-reveal", "Boss reveal", "Dark cinematic image with controlled supernatural bloom.", "end-void", { bloomIntensity: 0.3, vignetteAmount: 0.64, contrast: 1.4, brightness: 0.78, chromaticAberrationAmount: 0.09 }),
  finish("high-contrast-trailer", "High contrast trailer", "Trailer-grade punch with grain and deep framing.", "noir", { saturation: 0.72, contrast: 1.58, brightness: 0.92, bloomIntensity: 0.16, grainAmount: 0.18, vignetteAmount: 0.52 })
];

export function applyStudioFinish(project: MineMotionProject, finishId: StudioFinishId): MineMotionProject {
  const recipe = getStudioFinish(finishId);
  const base = getPostProcessingPreset(recipe.basePresetId).settings;
  return {
    ...project,
    postProcessing: withPostProcessingDefaults({ ...base, ...recipe.overrides, enabled: true, presetId: recipe.basePresetId }),
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  };
}

export function addPostStackLayer(project: MineMotionProject, presetId: PostProcessingPresetId, weight = 1, name?: string): MineMotionProject {
  if (project.creationSuite.postStack.length >= 16) return project;
  const preset = getPostProcessingPreset(presetId);
  const layer: PostStackLayer = {
    id: nextLayerId(project.creationSuite.postStack),
    name: name?.trim().slice(0, 120) || preset.name,
    presetId,
    weight: clamp(weight, 0, 1),
    enabled: true
  };
  return withPostStack(project, [...project.creationSuite.postStack, layer]);
}

export function updatePostStackLayer(project: MineMotionProject, layerId: string, patch: Partial<Omit<PostStackLayer, "id">>): MineMotionProject {
  return withPostStack(project, project.creationSuite.postStack.map((layer) => layer.id === layerId ? {
    ...layer,
    ...patch,
    id: layer.id,
    name: patch.name === undefined ? layer.name : patch.name.trim().slice(0, 120) || layer.name,
    presetId: isPresetId(patch.presetId) ? patch.presetId : layer.presetId,
    weight: patch.weight === undefined ? layer.weight : clamp(patch.weight, 0, 1)
  } : layer));
}

export function removePostStackLayer(project: MineMotionProject, layerId: string): MineMotionProject {
  return withPostStack(project, project.creationSuite.postStack.filter((layer) => layer.id !== layerId));
}

export function movePostStackLayer(project: MineMotionProject, layerId: string, direction: -1 | 1): MineMotionProject {
  const layers = [...project.creationSuite.postStack];
  const index = layers.findIndex((layer) => layer.id === layerId);
  const destination = index + direction;
  if (index < 0 || destination < 0 || destination >= layers.length) return project;
  [layers[index], layers[destination]] = [layers[destination], layers[index]];
  return withPostStack(project, layers);
}

export function clearPostStack(project: MineMotionProject): MineMotionProject {
  return withPostStack(project, []);
}

export function evaluatePostStack(project: MineMotionProject): PostProcessingSettings {
  let result = { ...project.postProcessing };
  for (const layer of project.creationSuite.postStack) {
    if (!layer.enabled || layer.weight <= 0 || !isPresetId(layer.presetId)) continue;
    const preset = getPostProcessingPreset(layer.presetId).settings;
    result = blendPostSettings(result, preset, layer.weight);
  }
  return withPostProcessingDefaults(result);
}

export function flattenPostStack(project: MineMotionProject): MineMotionProject {
  return {
    ...project,
    postProcessing: evaluatePostStack(project),
    creationSuite: { ...project.creationSuite, postStack: [] },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  };
}

export function createPostStackFromFinish(project: MineMotionProject, finishId: StudioFinishId): MineMotionProject {
  const recipe = getStudioFinish(finishId);
  const base = addPostStackLayer(clearPostStack(project), recipe.basePresetId, 1, recipe.name);
  return applyStudioFinish(base, finishId);
}

export function exportPostFinishManifest(project: MineMotionProject): string {
  return JSON.stringify({
    format: "minemotion-post-finish-v1",
    activeSettings: project.postProcessing,
    stack: project.creationSuite.postStack,
    evaluatedSettings: evaluatePostStack(project),
    availableFinishes: STUDIO_FINISH_RECIPES,
    availablePresets: POST_PROCESSING_PRESETS.map(({ id, name, description }) => ({ id, name, description }))
  }, null, 2);
}

export function getStudioFinish(id: StudioFinishId): StudioFinishRecipe {
  return STUDIO_FINISH_RECIPES.find((recipe) => recipe.id === id) ?? STUDIO_FINISH_RECIPES[0];
}

function blendPostSettings(first: PostProcessingSettings, second: PostProcessingSettings, weight: number): PostProcessingSettings {
  const mix = (a: number, b: number) => a + (b - a) * weight;
  return {
    enabled: first.enabled || second.enabled,
    presetId: weight >= 0.5 ? second.presetId : first.presetId,
    bloomIntensity: mix(first.bloomIntensity, second.bloomIntensity),
    vignetteAmount: mix(first.vignetteAmount, second.vignetteAmount),
    saturation: mix(first.saturation, second.saturation),
    contrast: mix(first.contrast, second.contrast),
    brightness: mix(first.brightness, second.brightness),
    hueShift: mixHue(first.hueShift, second.hueShift, weight),
    grainAmount: mix(first.grainAmount, second.grainAmount),
    chromaticAberrationAmount: mix(first.chromaticAberrationAmount, second.chromaticAberrationAmount),
    pixelationAmount: mix(first.pixelationAmount, second.pixelationAmount),
    exposure: mix(first.exposure, second.exposure),
    fogColor: mixColor(first.fogColor, second.fogColor, weight),
    fogIntensity: mix(first.fogIntensity, second.fogIntensity)
  };
}

function withPostStack(project: MineMotionProject, postStack: PostStackLayer[]): MineMotionProject {
  return {
    ...project,
    creationSuite: { ...project.creationSuite, postStack: postStack.slice(0, 16) },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  };
}
function nextLayerId(layers: readonly PostStackLayer[]): string { let index = layers.length + 1; const ids = new Set(layers.map((layer) => layer.id)); while (ids.has(`post_layer_${index}`)) index += 1; return `post_layer_${index}`; }
function isPresetId(value: unknown): value is PostProcessingPresetId { return typeof value === "string" && POST_PROCESSING_PRESETS.some((preset) => preset.id === value); }
function finish(id: StudioFinishId, name: string, description: string, basePresetId: PostProcessingPresetId, overrides: Partial<PostProcessingSettings>): StudioFinishRecipe { return { id, name, description, basePresetId, overrides }; }
function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min)); }
function mixHue(first: number, second: number, weight: number): number { const delta = ((second - first + 540) % 360) - 180; return (first + delta * weight + 360) % 360; }
function mixColor(first: string, second: string, weight: number): string {
  const a = parseColor(first); const b = parseColor(second);
  return `#${[0, 1, 2].map((index) => Math.round(a[index] + (b[index] - a[index]) * weight).toString(16).padStart(2, "0")).join("")}`;
}
function parseColor(value: string): [number, number, number] { const normalized = /^#[0-9a-f]{6}$/i.test(value) ? value.slice(1) : "000000"; return [parseInt(normalized.slice(0, 2), 16), parseInt(normalized.slice(2, 4), 16), parseInt(normalized.slice(4, 6), 16)]; }
