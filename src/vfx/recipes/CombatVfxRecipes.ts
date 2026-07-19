import type { Vector3Tuple } from "../../core/scene/SceneTypes";
import type { VfxParameterValue } from "../core/VfxParameter";
import { VFX_PRIMITIVE_VERSION, type VfxPrimitiveDescriptor } from "../primitives/VfxPrimitiveTypes";
import type { VfxActiveFrameEvaluation } from "../runtime/VfxFrameEvaluator";
import { VFX_PRESET_RECIPE_VERSION, type VfxPresetRecipe } from "./VfxPresetRecipeTypes";

export const COMBAT_VFX_RECIPE_IDS = Object.freeze([
  "combatSparks",
  "combatImpact",
  "swordSlash",
  "parryBurst",
  "groundSlam",
  "landingDust",
  "criticalHit",
  "hitStop"
] as const);

export type CombatVfxRecipeId = (typeof COMBAT_VFX_RECIPE_IDS)[number];

function numberParameter(frame: VfxActiveFrameEvaluation, id: string, fallback: number): number {
  const value = frame.inputs.parameters[id];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringParameter(frame: VfxActiveFrameEvaluation, id: string, fallback: string): string {
  const value: VfxParameterValue | undefined = frame.inputs.parameters[id];
  return typeof value === "string" ? value : fallback;
}

function recipe(id: CombatVfxRecipeId, buildDescriptors: VfxPresetRecipe["buildDescriptors"]): VfxPresetRecipe {
  return Object.freeze({ version: VFX_PRESET_RECIPE_VERSION, id, definitionId: id, buildDescriptors });
}

function ring(frame: VfxActiveFrameEvaluation, id: string, color: string, radius: number, alpha: number, segments = 72): VfxPrimitiveDescriptor {
  return {
    version: VFX_PRIMITIVE_VERSION,
    id,
    kind: "expanding-ring",
    color,
    center: [0, 0.05, 0],
    startRadius: Math.max(0, radius * 0.08),
    endRadius: Math.max(0.05, radius),
    thickness: Math.max(0.01, radius * 0.025),
    segments,
    startOpacity: alpha,
    endOpacity: 0
  };
}

function particles(frame: VfxActiveFrameEvaluation, id: string, color: string, defaults: { count: number; radius: number; speed: number; size: number; alpha: number; shape?: "point" | "sphere" | "ring" | "box" }): VfxPrimitiveDescriptor | null {
  const size = numberParameter(frame, "size", defaults.size);
  const count = Math.round(numberParameter(frame, "count", defaults.count));
  if (count <= 0) return null;
  return {
    version: VFX_PRIMITIVE_VERSION,
    id,
    kind: "particle-emitter",
    color,
    count,
    shape: defaults.shape ?? "sphere",
    radius: numberParameter(frame, "radius", defaults.radius),
    speed: numberParameter(frame, "speed", defaults.speed),
    lifetimeSeconds: Math.max(1 / frame.fps, frame.durationSeconds),
    startSize: size,
    endSize: size * 0.25,
    startOpacity: numberParameter(frame, "alpha", defaults.alpha),
    endOpacity: 0
  };
}

function compact(
  ...descriptors: Array<VfxPrimitiveDescriptor | null>
): VfxPrimitiveDescriptor[] {
  return descriptors.filter(
    (descriptor): descriptor is VfxPrimitiveDescriptor => descriptor !== null
  );
}

const RECIPES: readonly VfxPresetRecipe[] = Object.freeze([
  recipe("combatSparks", (frame) => compact(
    particles(frame, "sparks", stringParameter(frame, "color", "#ffd36a"), { count: 28, radius: 0.18, speed: 5.5, size: 0.08, alpha: 1, shape: "point" })
  )),
  recipe("combatImpact", (frame) => {
    const color = stringParameter(frame, "color", "#fff3c4");
    const radius = numberParameter(frame, "radius", 1.5);
    return [
      ring(frame, "impact-ring", color, radius, numberParameter(frame, "alpha", 0.95), 72),
      { version: VFX_PRIMITIVE_VERSION, id: "impact-light", kind: "light-pulse", color, center: [0, 0.5, 0], startRadius: radius * 0.15, endRadius: radius, baseIntensity: 0, peakIntensity: numberParameter(frame, "intensity", 1.4) }
    ];
  }),
  recipe("swordSlash", (frame) => {
    const radius = numberParameter(frame, "radius", 1.8);
    const points: readonly Vector3Tuple[] = [[-radius, 0.2, 0], [-radius * 0.55, radius * 0.75, 0], [0, radius, 0], [radius * 0.65, radius * 0.55, 0], [radius, 0, 0]];
    return [{ version: VFX_PRIMITIVE_VERSION, id: "slash-arc", kind: "trail", color: stringParameter(frame, "color", "#d8f3ff"), points, segments: 88, startWidth: numberParameter(frame, "size", 0.16), endWidth: 0.015, startOpacity: numberParameter(frame, "alpha", 0.9) * (1 - frame.progress * 0.4), endOpacity: 0 }];
  }),
  recipe("parryBurst", (frame) => {
    const color = stringParameter(frame, "color", "#a9e8ff");
    const secondary = stringParameter(frame, "secondaryColor", "#ffffff");
    const radius = numberParameter(frame, "radius", 1.3);
    const beam = (id: string, start: Vector3Tuple, end: Vector3Tuple, beamColor: string): VfxPrimitiveDescriptor => ({ version: VFX_PRIMITIVE_VERSION, id, kind: "beam", color: beamColor, start, end, subdivisions: 18, jitter: 0.04, width: 0.08, opacity: numberParameter(frame, "alpha", 1) * (1 - frame.progress) });
    return [beam("parry-a", [-radius, -radius, 0], [radius, radius, 0], color), beam("parry-b", [-radius, radius, 0], [radius, -radius, 0], secondary), ring(frame, "parry-ring", color, radius * 1.25, 0.9, 56)];
  }),
  recipe("groundSlam", (frame) => {
    const color = stringParameter(frame, "color", "#d8b17a");
    return compact(ring(frame, "slam-ring", color, numberParameter(frame, "radius", 4.5), numberParameter(frame, "alpha", 0.9), 112), particles(frame, "slam-debris", color, { count: 48, radius: 0.4, speed: 3.2, size: 0.14, alpha: 0.9, shape: "ring" }));
  }),
  recipe("landingDust", (frame) => {
    const color = stringParameter(frame, "color", "#b8aa92");
    return compact(particles(frame, "landing-dust", color, { count: 36, radius: 0.65, speed: 1.5, size: 0.22, alpha: 0.65, shape: "ring" }), ring(frame, "landing-ring", color, numberParameter(frame, "radius", 2.2), 0.45, 64));
  }),
  recipe("criticalHit", (frame) => {
    const color = stringParameter(frame, "color", "#fff0a6");
    const secondary = stringParameter(frame, "secondaryColor", "#ff4d6d");
    const radius = numberParameter(frame, "radius", 2.4);
    return compact(particles(frame, "critical-burst", secondary, { count: 54, radius: 0.15, speed: 6.2, size: 0.12, alpha: 1, shape: "point" }), ring(frame, "critical-ring", color, radius, 1, 96), { version: VFX_PRIMITIVE_VERSION, id: "critical-light", kind: "light-pulse", color, center: [0, 0.6, 0], startRadius: 0.1, endRadius: radius, baseIntensity: 0, peakIntensity: numberParameter(frame, "intensity", 2) });
  }),
  recipe("hitStop", (frame) => [{ version: VFX_PRIMITIVE_VERSION, id: "hit-stop-accent", kind: "light-pulse", color: stringParameter(frame, "color", "#ffffff"), center: [0, 0, 0], startRadius: 0, endRadius: 0.1, baseIntensity: 0, peakIntensity: numberParameter(frame, "intensity", 1) }])
]);

const BY_ID = new Map(RECIPES.map((entry) => [entry.id, entry]));

export function getCombatVfxRecipe(definitionId: string): VfxPresetRecipe | null {
  return BY_ID.get(definitionId) ?? null;
}

export function listCombatVfxRecipes(): readonly VfxPresetRecipe[] {
  return RECIPES;
}
