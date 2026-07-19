import type { Vector3Tuple } from "../../core/scene/SceneTypes";
import { VFX_PRIMITIVE_VERSION, type VfxPrimitiveDescriptor } from "../primitives/VfxPrimitiveTypes";
import type { VfxActiveFrameEvaluation } from "../runtime/VfxFrameEvaluator";
import { VFX_PRESET_RECIPE_VERSION, type VfxPresetRecipe } from "./VfxPresetRecipeTypes";

export const MOVEMENT_VFX_RECIPE_IDS = Object.freeze([
  "movementDash", "movementWeaponTrail", "movementProjectileTrail",
  "movementFootsteps", "movementRunning", "movementFalling", "movementFlying",
  "movementElytraTrail", "movementEnderPearlTrail", "movementSwimmingTrail"
] as const);

type MovementRecipeId = (typeof MOVEMENT_VFX_RECIPE_IDS)[number];

function n(frame: VfxActiveFrameEvaluation, id: string, fallback: number): number {
  const value = frame.inputs.parameters[id];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function s(frame: VfxActiveFrameEvaluation, id: string, fallback: string): string {
  const value = frame.inputs.parameters[id];
  return typeof value === "string" ? value : fallback;
}

function recipe(id: MovementRecipeId, buildDescriptors: VfxPresetRecipe["buildDescriptors"]): VfxPresetRecipe {
  return Object.freeze({ version: VFX_PRESET_RECIPE_VERSION, id, definitionId: id, buildDescriptors });
}

function directionVector(frame: VfxActiveFrameEvaluation): Vector3Tuple {
  switch (s(frame, "direction", "forward")) {
    case "backward": return [0, 0, 1];
    case "left": return [-1, 0, 0];
    case "right": return [1, 0, 0];
    case "radial": return [0.70710678, 0, -0.70710678];
    default: return [0, 0, -1];
  }
}

function path(frame: VfxActiveFrameEvaluation, y: number, lateral = 0, vertical = 0): readonly Vector3Tuple[] {
  const radius = n(frame, "radius", 4);
  const speedCurve = Math.min(radius * 0.25, n(frame, "speed", 4) * 0.05);
  const [dx, , dz] = directionVector(frame);
  const sideX = -dz * lateral;
  const sideZ = dx * lateral;
  return [
    [sideX, y, sideZ],
    [dx * radius * 0.32 + sideX, y + vertical * 0.4 + speedCurve, dz * radius * 0.32 + sideZ],
    [dx * radius * 0.68 + sideX, y + vertical * 0.75 - speedCurve * 0.3, dz * radius * 0.68 + sideZ],
    [dx * radius + sideX, y + vertical, dz * radius + sideZ]
  ];
}

function trail(frame: VfxActiveFrameEvaluation, id: string, points: readonly Vector3Tuple[], segments: number, colorId = "color", widthScale = 1): VfxPrimitiveDescriptor {
  const intensity = Math.max(0, n(frame, "intensity", 1));
  return {
    version: VFX_PRIMITIVE_VERSION,
    id,
    kind: "trail",
    color: s(frame, colorId, "#ffffff"),
    points,
    segments,
    startWidth: Math.max(0.001, n(frame, "size", 0.1) * intensity * widthScale),
    endWidth: Math.max(0.001, n(frame, "size", 0.1) * 0.08),
    startOpacity: Math.min(1, n(frame, "alpha", 0.8)) * Math.min(2, intensity) / 2,
    endOpacity: 0
  };
}

function particles(frame: VfxActiveFrameEvaluation, id: string, fallbackCount: number, colorId = "color", shape: "point" | "sphere" | "ring" | "box" = "point"): VfxPrimitiveDescriptor | null {
  const count = Math.round(n(frame, "count", fallbackCount));
  if (count <= 0) return null;
  const size = n(frame, "size", 0.1);
  return {
    version: VFX_PRIMITIVE_VERSION,
    id,
    kind: "particle-emitter",
    color: s(frame, colorId, "#ffffff"),
    count,
    shape,
    radius: n(frame, "radius", 3),
    speed: n(frame, "speed", 3) * Math.max(0.1, n(frame, "intensity", 1)),
    lifetimeSeconds: Math.max(1 / frame.fps, frame.durationSeconds),
    startSize: size,
    endSize: size * 0.2,
    startOpacity: n(frame, "alpha", 0.8),
    endOpacity: 0
  };
}

function ring(
  frame: VfxActiveFrameEvaluation,
  id: string,
  segments = 64,
  center: Vector3Tuple = [0, 0.04, 0]
): VfxPrimitiveDescriptor {
  const radius = n(frame, "radius", 1);
  return {
    version: VFX_PRIMITIVE_VERSION,
    id,
    kind: "expanding-ring",
    color: s(frame, "secondaryColor", s(frame, "color", "#ffffff")),
    center,
    startRadius: radius * 0.1,
    endRadius: radius,
    thickness: Math.max(0.01, n(frame, "size", 0.1) * Math.max(0.1, n(frame, "intensity", 1))),
    segments,
    startOpacity: Math.min(1, n(frame, "alpha", 0.8)) * Math.min(2, Math.max(0, n(frame, "intensity", 1))) / 2,
    endOpacity: 0
  };
}

function light(frame: VfxActiveFrameEvaluation, id: string): VfxPrimitiveDescriptor {
  return {
    version: VFX_PRIMITIVE_VERSION,
    id,
    kind: "light-pulse",
    color: s(frame, "secondaryColor", s(frame, "color", "#ffffff")),
    center: [0, 0.5, 0],
    startRadius: n(frame, "size", 0.1),
    endRadius: n(frame, "radius", 4) * 0.3,
    baseIntensity: 0,
    peakIntensity: n(frame, "intensity", 1)
  };
}

function compact(...items: Array<VfxPrimitiveDescriptor | null>): VfxPrimitiveDescriptor[] {
  return items.filter((item): item is VfxPrimitiveDescriptor => item !== null);
}

const RECIPES = Object.freeze([
  recipe("movementDash", (frame) => [
    trail(frame, "dash-outer", path(frame, 0.9, 0), 96),
    trail(frame, "dash-core", path(frame, 0.9, 0.04), 64, "secondaryColor", 0.4),
    ring(frame, "dash-launch", 64)
  ]),
  recipe("movementWeaponTrail", (frame) => [
    trail(frame, "weapon-outer", path(frame, 1.2, 0, n(frame, "radius", 2.1) * 0.25), 96),
    trail(frame, "weapon-edge", path(frame, 1.2, n(frame, "size", 0.14) * n(frame, "speed", 3.5) * 0.1), 64, "secondaryColor", 0.35)
  ]),
  recipe("movementProjectileTrail", (frame) => compact(
    trail(frame, "projectile-path", path(frame, 1), 96),
    particles(frame, "projectile-motes", 32, "secondaryColor", "point"),
    light(frame, "projectile-core")
  )),
  recipe("movementFootsteps", (frame) => compact(
    particles(frame, "footstep-dust", 24, "color", "ring"),
    ring(frame, "footstep-left", 64),
    ring(frame, "footstep-right", 64, [n(frame, "radius", 0.45), 0.04, n(frame, "speed", 1.2) * -0.08])
  )),
  recipe("movementRunning", (frame) => compact(
    trail(frame, "running-wake", path(frame, 0.35, 0, n(frame, "speed", 4) * 0.03), 80),
    particles(frame, "running-dust", 28, "secondaryColor", "ring")
  )),
  recipe("movementFalling", (frame) => {
    const radius = n(frame, "radius", 4);
    const speed = n(frame, "speed", 5);
    const points: readonly Vector3Tuple[] = [[0, radius, 0], [0.08, radius * 0.65, 0], [-0.06, radius * 0.3, speed * 0.02], [0, 0, 0]];
    return compact(trail(frame, "falling-column", points, 96), particles(frame, "falling-air", 36, "secondaryColor", "box"));
  }),
  recipe("movementFlying", (frame) => compact(
    trail(frame, "flying-left", path(frame, 1.15, -0.45), 96),
    trail(frame, "flying-right", path(frame, 1.15, 0.45), 64, "secondaryColor", 0.65),
    particles(frame, "flying-air", 40, "color", "box")
  )),
  recipe("movementElytraTrail", (frame) => compact(
    trail(frame, "elytra-left", path(frame, 1.1, -0.75, n(frame, "speed", 7) * 0.04), 96),
    trail(frame, "elytra-right", path(frame, 1.1, 0.75, n(frame, "speed", 7) * 0.04), 96, "secondaryColor", 0.8),
    particles(frame, "elytra-air", 32, "color", "box")
  )),
  recipe("movementEnderPearlTrail", (frame) => compact(
    trail(frame, "ender-pearl-path", path(frame, 1, 0, n(frame, "speed", 5) * 0.05), 96),
    particles(frame, "ender-pearl-motes", 36, "secondaryColor", "sphere"),
    ring(frame, "ender-pearl-pulse", 64)
  )),
  recipe("movementSwimmingTrail", (frame) => compact(
    trail(frame, "swimming-current", path(frame, 0.8, 0, Math.sin(frame.progress * Math.PI) * n(frame, "speed", 2.4) * 0.08), 96),
    particles(frame, "swimming-bubbles", 38, "secondaryColor", "sphere"),
    ring(frame, "swimming-ripple", 64)
  ))
] satisfies readonly VfxPresetRecipe[]);

export function listMovementVfxRecipes(): readonly VfxPresetRecipe[] {
  return RECIPES;
}
