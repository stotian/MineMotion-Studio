import type { Vector3Tuple } from "../../core/scene/SceneTypes";
import { VFX_PRIMITIVE_VERSION, type VfxPrimitiveDescriptor } from "../primitives/VfxPrimitiveTypes";
import type { VfxActiveFrameEvaluation } from "../runtime/VfxFrameEvaluator";
import { VFX_PRESET_RECIPE_VERSION, type VfxPresetRecipe } from "./VfxPresetRecipeTypes";

export const ELECTRIC_VFX_RECIPE_IDS = Object.freeze([
  "electricStrike", "electricStorm", "electricBeam", "electricAura",
  "electricCharge", "electricSparks", "chainLightning", "electricWeaponTrail"
] as const);

function n(frame: VfxActiveFrameEvaluation, id: string, fallback: number): number {
  const value = frame.inputs.parameters[id];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function s(frame: VfxActiveFrameEvaluation, id: string, fallback: string): string {
  const value = frame.inputs.parameters[id];
  return typeof value === "string" ? value : fallback;
}

function recipe(id: (typeof ELECTRIC_VFX_RECIPE_IDS)[number], buildDescriptors: VfxPresetRecipe["buildDescriptors"]): VfxPresetRecipe {
  return Object.freeze({ version: VFX_PRESET_RECIPE_VERSION, id, definitionId: id, buildDescriptors });
}

function beam(frame: VfxActiveFrameEvaluation, id: string, start: Vector3Tuple, end: Vector3Tuple, color = s(frame, "color", "#aee8ff"), subdivisions = 48): VfxPrimitiveDescriptor {
  return { version: VFX_PRIMITIVE_VERSION, id, kind: "beam", color, start, end, subdivisions, jitter: 0.12 * n(frame, "intensity", 1), width: Math.max(0.015, n(frame, "size", 0.08)), opacity: n(frame, "alpha", 0.95) * (1 - frame.progress * 0.35) };
}

function particles(frame: VfxActiveFrameEvaluation, id: string, shape: "point" | "sphere" | "ring", fallbackCount: number): VfxPrimitiveDescriptor | null {
  const count = Math.round(n(frame, "count", fallbackCount));
  if (count <= 0) return null;
  const size = n(frame, "size", 0.07);
  return { version: VFX_PRIMITIVE_VERSION, id, kind: "particle-emitter", color: s(frame, "color", "#aee8ff"), count, shape, radius: n(frame, "radius", 1), speed: n(frame, "speed", 2) * Math.max(0.1, n(frame, "intensity", 1)), lifetimeSeconds: Math.max(1 / frame.fps, frame.durationSeconds), startSize: size, endSize: size * 0.2, startOpacity: n(frame, "alpha", 0.9), endOpacity: 0 };
}

function ring(frame: VfxActiveFrameEvaluation, id: string, scale = 1): VfxPrimitiveDescriptor {
  const radius = n(frame, "radius", 2) * scale;
  return { version: VFX_PRIMITIVE_VERSION, id, kind: "expanding-ring", color: s(frame, "color", "#aee8ff"), center: [0, 0.05, 0], startRadius: Math.max(0, radius * 0.15), endRadius: radius, thickness: Math.max(0.01, radius * 0.02), segments: 72, startOpacity: Math.min(1, n(frame, "alpha", 0.9) * Math.max(0, n(frame, "intensity", 1))), endOpacity: 0 };
}

function light(frame: VfxActiveFrameEvaluation, id: string, radius: number): VfxPrimitiveDescriptor {
  return { version: VFX_PRIMITIVE_VERSION, id, kind: "light-pulse", color: s(frame, "secondaryColor", s(frame, "color", "#ffffff")), center: [0, 0.5, 0], startRadius: 0.05, endRadius: radius, baseIntensity: 0, peakIntensity: n(frame, "intensity", 1.5) };
}

function compact(...items: Array<VfxPrimitiveDescriptor | null>): VfxPrimitiveDescriptor[] {
  return items.filter((item): item is VfxPrimitiveDescriptor => item !== null);
}

const RECIPES = Object.freeze([
  recipe("electricStrike", (frame) => compact(
    beam(frame, "strike-bolt", [0, n(frame, "radius", 5), 0], [0, 0, 0], s(frame, "color", "#aee8ff"), 72),
    particles(frame, "strike-sparks", "point", 20),
    light(frame, "strike-flare", n(frame, "radius", 5) * 0.45)
  )),
  recipe("electricStorm", (frame) => {
    const radius = n(frame, "radius", 7);
    const phase = (frame.frameSeed % 997) / 997;
    return [-0.65, 0, 0.65].map((offset, index) => beam(frame, `storm-bolt-${index}`, [offset * radius, radius + index, Math.sin(phase * Math.PI * 2 + index) * radius * 0.25], [offset * radius * 0.7, 0, index - 1], s(frame, "color", "#8fdcff"), 56));
  }),
  recipe("electricBeam", (frame) => [beam(frame, "focused-beam", [0, 1, 0], [0, 1, -n(frame, "radius", 6)], s(frame, "color", "#9cecff"), 96), light(frame, "beam-core", n(frame, "radius", 6) * 0.15)]),
  recipe("electricAura", (frame) => compact(particles(frame, "aura-sparks", "sphere", 34), ring(frame, "aura-ring", 1))),
  recipe("electricCharge", (frame) => compact(particles(frame, "charge-field", "sphere", 42), ring(frame, "charge-ring", 1 - frame.progress * 0.65), light(frame, "charge-core", n(frame, "radius", 2.4) * (0.3 + frame.progress * 0.7)))),
  recipe("electricSparks", (frame) => compact(particles(frame, "electric-sparks", "point", 32))),
  recipe("chainLightning", (frame) => {
    const radius = n(frame, "radius", 6);
    const points: Vector3Tuple[] = [[0, 1, 0], [radius * 0.3, 1.6, -radius * 0.25], [-radius * 0.2, 1.1, -radius * 0.55], [radius * 0.45, 0.8, -radius]];
    return points.slice(0, -1).map((point, index) => beam(frame, `chain-link-${index}`, point, points[index + 1], index % 2 === 0 ? s(frame, "color", "#a7e9ff") : s(frame, "secondaryColor", "#ffffff"), 36));
  }),
  recipe("electricWeaponTrail", (frame) => {
    const radius = n(frame, "radius", 2);
    const points: readonly Vector3Tuple[] = [[-radius, 0, 0], [-radius * 0.5, radius * 0.7, 0], [0.2 * radius, radius, 0], [radius, radius * 0.25, 0]];
    const width = Math.max(0.001, n(frame, "size", 0.13) * Math.max(0.25, n(frame, "intensity", 1.3)));
    const opacity = n(frame, "alpha", 0.9) * (1 - frame.progress * 0.5);
    return [
      { version: VFX_PRIMITIVE_VERSION, id: "electric-weapon-arc", kind: "trail", color: s(frame, "color", "#9be7ff"), points, segments: 96, startWidth: width, endWidth: 0.01, startOpacity: opacity, endOpacity: 0 },
      { version: VFX_PRIMITIVE_VERSION, id: "electric-weapon-core", kind: "trail", color: s(frame, "secondaryColor", "#ffffff"), points, segments: 64, startWidth: width * 0.35, endWidth: 0.005, startOpacity: Math.min(1, opacity), endOpacity: 0 }
    ];
  })
] satisfies readonly VfxPresetRecipe[]);

export function listElectricVfxRecipes(): readonly VfxPresetRecipe[] {
  return RECIPES;
}
