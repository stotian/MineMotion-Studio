import type { Vector3Tuple } from "../../core/scene/SceneTypes";
import { VFX_PRIMITIVE_VERSION, type VfxParticleSpawnShape, type VfxPrimitiveDescriptor } from "../primitives/VfxPrimitiveTypes";
import type { VfxActiveFrameEvaluation } from "../runtime/VfxFrameEvaluator";
import { VFX_PRESET_RECIPE_VERSION, type VfxPresetRecipe } from "./VfxPresetRecipeTypes";

export const MAGIC_VFX_RECIPE_IDS = Object.freeze([
  "magicAura", "magicBeam", "magicProjectile", "magicPortal",
  "magicTeleport", "magicHeal", "magicCorruption", "magicPowerUp"
] as const);

function n(frame: VfxActiveFrameEvaluation, id: string, fallback: number): number {
  const value = frame.inputs.parameters[id];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function s(frame: VfxActiveFrameEvaluation, id: string, fallback: string): string {
  const value = frame.inputs.parameters[id];
  return typeof value === "string" ? value : fallback;
}
function recipe(id: (typeof MAGIC_VFX_RECIPE_IDS)[number], buildDescriptors: VfxPresetRecipe["buildDescriptors"]): VfxPresetRecipe {
  return Object.freeze({ version: VFX_PRESET_RECIPE_VERSION, id, definitionId: id, buildDescriptors });
}
function particles(frame: VfxActiveFrameEvaluation, id: string, shape: VfxParticleSpawnShape, fallbackCount: number): VfxPrimitiveDescriptor | null {
  const count = Math.round(n(frame, "count", fallbackCount));
  if (count <= 0) return null;
  const size = n(frame, "size", 0.1);
  return { version: VFX_PRIMITIVE_VERSION, id, kind: "particle-emitter", color: s(frame, "color", "#b978ff"), count, shape, radius: n(frame, "radius", 2), speed: n(frame, "speed", 1.5) * Math.max(0.1, n(frame, "intensity", 1)), lifetimeSeconds: Math.max(1 / frame.fps, frame.durationSeconds), startSize: size, endSize: size * 0.2, startOpacity: n(frame, "alpha", 0.9), endOpacity: 0 };
}
function ring(frame: VfxActiveFrameEvaluation, id: string, scale = 1, reverse = false, colorId = "color"): VfxPrimitiveDescriptor {
  const radius = n(frame, "radius", 2) * scale;
  return { version: VFX_PRIMITIVE_VERSION, id, kind: "expanding-ring", color: s(frame, colorId, "#b978ff"), center: [0, 0.08, 0], startRadius: reverse ? radius : radius * 0.08, endRadius: reverse ? radius * 0.05 : radius, thickness: Math.max(0.01, radius * 0.025), segments: 80, startOpacity: Math.min(1, n(frame, "alpha", 0.9) * Math.max(0, n(frame, "intensity", 1))), endOpacity: 0 };
}
function light(frame: VfxActiveFrameEvaluation, id: string): VfxPrimitiveDescriptor {
  return { version: VFX_PRIMITIVE_VERSION, id, kind: "light-pulse", color: s(frame, "secondaryColor", "#ffffff"), center: [0, 0.7, 0], startRadius: 0.05, endRadius: n(frame, "radius", 2), baseIntensity: 0, peakIntensity: n(frame, "intensity", 1.4) };
}
function compact(...items: Array<VfxPrimitiveDescriptor | null>): VfxPrimitiveDescriptor[] {
  return items.filter((item): item is VfxPrimitiveDescriptor => item !== null);
}

const RECIPES = Object.freeze([
  recipe("magicAura", (frame) => compact(particles(frame, "magic-aura-motes", "sphere", 38), ring(frame, "magic-aura-ring", 1), light(frame, "magic-aura-core"))),
  recipe("magicBeam", (frame) => {
    const radius = n(frame, "radius", 7);
    const width = Math.max(0.015, n(frame, "size", 0.12) * n(frame, "intensity", 1.6));
    const makeBeam = (id: string, color: string, subdivisions: number, scale: number): VfxPrimitiveDescriptor => ({ version: VFX_PRIMITIVE_VERSION, id, kind: "beam", color, start: [0, 1, 0], end: [0, 1, -radius], subdivisions, jitter: 0.08 * n(frame, "intensity", 1.6), width: width * scale, opacity: n(frame, "alpha", 0.95) * (1 - frame.progress * 0.25) });
    return [makeBeam("magic-beam-outer", s(frame, "color", "#9c6cff"), 96, 1), makeBeam("magic-beam-core", s(frame, "secondaryColor", "#ffffff"), 64, 0.35)];
  }),
  recipe("magicProjectile", (frame) => {
    const radius = n(frame, "radius", 4);
    const points: readonly Vector3Tuple[] = [[0, 1, 0], [0.2, 1.15, -radius * 0.35], [-0.1, 0.95, -radius * 0.7], [0, 1, -radius]];
    return [{ version: VFX_PRIMITIVE_VERSION, id: "magic-projectile-trail", kind: "trail", color: s(frame, "color", "#7f8cff"), points, segments: 96, startWidth: Math.max(0.001, n(frame, "size", 0.16) * n(frame, "intensity", 1.5)), endWidth: 0.01, startOpacity: n(frame, "alpha", 0.95), endOpacity: 0 }, light(frame, "magic-projectile-core")];
  }),
  recipe("magicPortal", (frame) => compact(ring(frame, "portal-outer", 1), ring(frame, "portal-inner", 0.65, false, "secondaryColor"), particles(frame, "portal-sparks", "ring", 44))),
  recipe("magicTeleport", (frame) => compact(ring(frame, "teleport-collapse", 1, true), particles(frame, "teleport-burst", "point", 48), light(frame, "teleport-flash"))),
  recipe("magicHeal", (frame) => compact(particles(frame, "heal-motes", "ring", 34), ring(frame, "heal-ring", 1), light(frame, "heal-light"))),
  recipe("magicCorruption", (frame) => compact(particles(frame, "corruption-motes", "sphere", 42), ring(frame, "corruption-ring", 1, true), ring(frame, "corruption-core", 0.55, false, "secondaryColor"))),
  recipe("magicPowerUp", (frame) => compact(particles(frame, "power-up-motes", "ring", 56), ring(frame, "power-up-ring", 1, true), ring(frame, "power-up-wave", 1.25, false, "secondaryColor"), light(frame, "power-up-core")))
] satisfies readonly VfxPresetRecipe[]);

export function listMagicVfxRecipes(): readonly VfxPresetRecipe[] {
  return RECIPES;
}
