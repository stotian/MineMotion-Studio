import { VFX_PRIMITIVE_VERSION, type VfxPrimitiveDescriptor, type VfxParticleSpawnShape } from "../primitives/VfxPrimitiveTypes";
import type { VfxActiveFrameEvaluation } from "../runtime/VfxFrameEvaluator";
import { VFX_PRESET_RECIPE_VERSION, type VfxPresetRecipe } from "./VfxPresetRecipeTypes";

export const FIRE_VFX_RECIPE_IDS = Object.freeze([
  "nativeFire", "smokePlume", "nativeExplosion", "emberBurst",
  "debrisBurst", "dustCloud", "netherFire", "soulFire"
] as const);

function n(frame: VfxActiveFrameEvaluation, id: string, fallback: number): number {
  const value = frame.inputs.parameters[id];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function s(frame: VfxActiveFrameEvaluation, id: string, fallback: string): string {
  const value = frame.inputs.parameters[id];
  return typeof value === "string" ? value : fallback;
}
function recipe(id: (typeof FIRE_VFX_RECIPE_IDS)[number], buildDescriptors: VfxPresetRecipe["buildDescriptors"]): VfxPresetRecipe {
  return Object.freeze({ version: VFX_PRESET_RECIPE_VERSION, id, definitionId: id, buildDescriptors });
}
function particles(frame: VfxActiveFrameEvaluation, id: string, shape: VfxParticleSpawnShape, fallbackCount: number, colorId = "color"): VfxPrimitiveDescriptor | null {
  const count = Math.round(n(frame, "count", fallbackCount));
  if (count <= 0) return null;
  const size = n(frame, "size", 0.15);
  return { version: VFX_PRIMITIVE_VERSION, id, kind: "particle-emitter", color: s(frame, colorId, "#ff8a2b"), count, shape, radius: n(frame, "radius", 1), speed: n(frame, "speed", 2) * Math.max(0.1, n(frame, "intensity", 1)), lifetimeSeconds: Math.max(1 / frame.fps, frame.durationSeconds), startSize: size, endSize: size * (id.includes("smoke") || id.includes("dust") ? 2 : 0.25), startOpacity: n(frame, "alpha", 0.9), endOpacity: 0 };
}
function ring(frame: VfxActiveFrameEvaluation, id: string, segments = 96): VfxPrimitiveDescriptor {
  const radius = n(frame, "radius", 3);
  return { version: VFX_PRIMITIVE_VERSION, id, kind: "expanding-ring", color: s(frame, "color", "#ff9f43"), center: [0, 0.05, 0], startRadius: radius * 0.08, endRadius: radius, thickness: Math.max(0.02, radius * 0.025), segments, startOpacity: n(frame, "alpha", 0.9), endOpacity: 0 };
}
function light(frame: VfxActiveFrameEvaluation, id: string): VfxPrimitiveDescriptor {
  return { version: VFX_PRIMITIVE_VERSION, id, kind: "light-pulse", color: s(frame, "secondaryColor", s(frame, "color", "#ffd166")), center: [0, 0.5, 0], startRadius: 0.05, endRadius: n(frame, "radius", 2), baseIntensity: 0, peakIntensity: n(frame, "intensity", 1.3) };
}
function compact(...items: Array<VfxPrimitiveDescriptor | null>): VfxPrimitiveDescriptor[] {
  return items.filter((item): item is VfxPrimitiveDescriptor => item !== null);
}

const RECIPES = Object.freeze([
  recipe("nativeFire", (frame) => compact(particles(frame, "fire-flames", "sphere", 42), light(frame, "fire-light"))),
  recipe("smokePlume", (frame) => compact(particles(frame, "smoke-plume", "sphere", 48))),
  recipe("nativeExplosion", (frame) => compact(particles(frame, "explosion-flame", "sphere", 64), ring(frame, "explosion-ring", 112), light(frame, "explosion-flash"))),
  recipe("emberBurst", (frame) => compact(particles(frame, "ember-particles", "point", 36))),
  recipe("debrisBurst", (frame) => compact(particles(frame, "debris-blocks", "box", 44))),
  recipe("dustCloud", (frame) => compact(particles(frame, "dust-cloud", "ring", 52), ring(frame, "dust-ring", 72))),
  recipe("netherFire", (frame) => compact(particles(frame, "nether-flames", "sphere", 46), light(frame, "nether-light"))),
  recipe("soulFire", (frame) => compact(particles(frame, "soul-flames", "sphere", 46), light(frame, "soul-light")))
] satisfies readonly VfxPresetRecipe[]);

export function listFireVfxRecipes(): readonly VfxPresetRecipe[] {
  return RECIPES;
}
