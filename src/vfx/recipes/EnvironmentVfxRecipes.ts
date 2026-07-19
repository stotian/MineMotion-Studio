import { VFX_PRIMITIVE_VERSION, type VfxParticleSpawnShape, type VfxPrimitiveDescriptor } from "../primitives/VfxPrimitiveTypes";
import type { VfxActiveFrameEvaluation } from "../runtime/VfxFrameEvaluator";
import { VFX_PRESET_RECIPE_VERSION, type VfxPresetRecipe } from "./VfxPresetRecipeTypes";

export const ENVIRONMENT_VFX_RECIPE_IDS = Object.freeze([
  "environmentRain", "environmentSnow", "environmentAsh", "environmentFog",
  "environmentDust", "environmentStorm", "environmentEnd", "environmentNether",
  "environmentCave", "environmentFireflies"
] as const);

function n(frame: VfxActiveFrameEvaluation, id: string, fallback: number): number {
  const value = frame.inputs.parameters[id];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function s(frame: VfxActiveFrameEvaluation, id: string, fallback: string): string {
  const value = frame.inputs.parameters[id];
  return typeof value === "string" ? value : fallback;
}
function recipe(id: (typeof ENVIRONMENT_VFX_RECIPE_IDS)[number], buildDescriptors: VfxPresetRecipe["buildDescriptors"]): VfxPresetRecipe {
  return Object.freeze({ version: VFX_PRESET_RECIPE_VERSION, id, definitionId: id, buildDescriptors });
}
function field(frame: VfxActiveFrameEvaluation, id: string, shape: VfxParticleSpawnShape, fallbackCount: number, growth = 0.7): VfxPrimitiveDescriptor | null {
  const count = Math.round(n(frame, "count", fallbackCount));
  if (count <= 0) return null;
  const size = n(frame, "size", 0.08);
  return { version: VFX_PRIMITIVE_VERSION, id, kind: "particle-emitter", color: s(frame, "color", "#ffffff"), count, shape, radius: n(frame, "radius", 6), speed: n(frame, "speed", 1) * Math.max(0.1, n(frame, "intensity", 1)), lifetimeSeconds: Math.max(1 / frame.fps, frame.durationSeconds), startSize: size, endSize: size * growth, startOpacity: n(frame, "alpha", 0.6), endOpacity: 0 };
}
function ring(frame: VfxActiveFrameEvaluation, id: string, colorId = "secondaryColor"): VfxPrimitiveDescriptor {
  const radius = n(frame, "radius", 6);
  return { version: VFX_PRIMITIVE_VERSION, id, kind: "expanding-ring", color: s(frame, colorId, s(frame, "color", "#ffffff")), center: [0, 0.1, 0], startRadius: radius * 0.2, endRadius: radius, thickness: Math.max(0.01, radius * 0.015), segments: 80, startOpacity: Math.min(1, n(frame, "alpha", 0.6) * n(frame, "intensity", 1)), endOpacity: 0 };
}
function light(frame: VfxActiveFrameEvaluation, id: string): VfxPrimitiveDescriptor {
  return { version: VFX_PRIMITIVE_VERSION, id, kind: "light-pulse", color: s(frame, "secondaryColor", s(frame, "color", "#ffffff")), center: [0, 1, 0], startRadius: 0.1, endRadius: n(frame, "radius", 5) * 0.6, baseIntensity: 0, peakIntensity: n(frame, "intensity", 1) };
}
function compact(...items: Array<VfxPrimitiveDescriptor | null>): VfxPrimitiveDescriptor[] {
  return items.filter((item): item is VfxPrimitiveDescriptor => item !== null);
}

const RECIPES = Object.freeze([
  recipe("environmentRain", (frame) => compact(field(frame, "rain-field", "box", 120, 0.25))),
  recipe("environmentSnow", (frame) => compact(field(frame, "snow-field", "sphere", 96, 0.8))),
  recipe("environmentAsh", (frame) => compact(field(frame, "ash-fall", "box", 84, 0.55))),
  recipe("environmentFog", (frame) => compact(field(frame, "ground-fog", "ring", 72, 2.2))),
  recipe("environmentDust", (frame) => compact(field(frame, "ambient-dust", "sphere", 76, 0.65))),
  recipe("environmentStorm", (frame) => {
    const radius = n(frame, "radius", 9);
    const bolt = (id: string, x: number): VfxPrimitiveDescriptor => ({ version: VFX_PRIMITIVE_VERSION, id, kind: "beam", color: s(frame, "secondaryColor", "#d9f4ff"), start: [x, radius, 0], end: [x * 0.6, 0, -radius * 0.2], subdivisions: 48, jitter: 0.16 * n(frame, "intensity", 1.4), width: Math.max(0.02, n(frame, "size", 0.05)), opacity: n(frame, "alpha", 0.65) });
    return compact(field(frame, "storm-rain", "box", 128, 0.2), bolt("storm-bolt-a", -radius * 0.3), bolt("storm-bolt-b", radius * 0.35));
  }),
  recipe("environmentEnd", (frame) => compact(field(frame, "end-motes", "sphere", 68, 0.4), ring(frame, "end-wave"))),
  recipe("environmentNether", (frame) => compact(field(frame, "nether-ash", "box", 76, 0.5), light(frame, "nether-heat"))),
  recipe("environmentCave", (frame) => compact(field(frame, "cave-drips", "box", 42, 0.35))),
  recipe("environmentFireflies", (frame) => compact(field(frame, "fireflies", "sphere", 36, 0.8), light(frame, "firefly-glow")))
] satisfies readonly VfxPresetRecipe[]);

export function listEnvironmentVfxRecipes(): readonly VfxPresetRecipe[] {
  return RECIPES;
}
