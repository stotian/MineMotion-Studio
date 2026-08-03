import { spawnEffectAtFrame } from "../../effects/EffectSpawner";
import { MAX_EFFECT_INSTANCES, type EffectInstance, type EffectParameters, type EffectType } from "../../effects/EffectTypes";
import type { MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { syncCinematicTimeline } from "../../project/CinematicTimeline";
import type { QuickVfxFavorite } from "./MinecraftStudioTypes";

export const QUICK_VFX_PRESET_IDS = [
  "block-break", "block-place", "torch-ignite", "tnt-explosion", "creeper-blast",
  "ender-teleport", "nether-portal", "critical-hit", "sword-clash", "bow-impact",
  "lightning-storm", "magic-charge", "boss-spawn", "elytra-boost", "underwater-burst",
  "snow-gust", "ash-fall", "cinematic-impact", "dream-reveal", "horror-presence"
] as const;
export type QuickVfxPresetId = (typeof QUICK_VFX_PRESET_IDS)[number];

export interface QuickVfxRecipeEffect {
  type: EffectType;
  offset: number;
  durationScale?: number;
  parameters?: Partial<EffectParameters>;
}

export interface QuickVfxRecipe {
  id: QuickVfxPresetId;
  name: string;
  category: "minecraft" | "combat" | "magic" | "environment" | "cinematic";
  description: string;
  effects: QuickVfxRecipeEffect[];
}

export interface InsertQuickVfxOptions {
  frame: number;
  position?: Vector3Tuple;
  targetObjectId?: string;
  intensity?: number;
  durationScale?: number;
}

export interface QuickVfxInsertResult {
  project: MineMotionProject;
  changed: boolean;
  effectIds: string[];
  error: string | null;
}

export const QUICK_VFX_RECIPES: readonly QuickVfxRecipe[] = [
  recipe("block-break", "Block break", "minecraft", "Dust, fragments and a short impact pulse.", [["debrisBurst", 0, { count: 20, radius: 0.8 }], ["dustCloud", 0, { count: 18, radius: 0.7 }], ["combatImpact", 0, { intensity: 0.35 }]]),
  recipe("block-place", "Block place", "minecraft", "Compact placement dust and confirmation glow.", [["landingDust", 0, { count: 10, radius: 0.45 }], ["glowBurst", 0, { count: 8, radius: 0.35 }]]),
  recipe("torch-ignite", "Torch ignite", "minecraft", "Warm ignition flash and embers.", [["nativeFire", 0, { radius: 0.4, color: "#ffb347" }], ["emberBurst", 0, { count: 14, radius: 0.7 }], ["glowBurst", 1, { count: 10, color: "#ffd27a" }]]),
  recipe("tnt-explosion", "TNT explosion", "minecraft", "Full explosion with flash, shockwave, debris and shake.", [["nativeExplosion", 0, { radius: 5, count: 72 }], ["explosionFlash", 0, { alpha: 0.9 }], ["shockwave", 1, { radius: 6 }], ["debrisBurst", 1, { count: 48 }], ["cameraShake", 0, { strength: 1.1 }]]),
  recipe("creeper-blast", "Creeper blast", "minecraft", "Green-tinted expanding explosion and ground dust.", [["nativeExplosion", 0, { color: "#6ee36e", radius: 4.2 }], ["shockwave", 1, { color: "#8cff8c", radius: 5 }], ["dustCloud", 2, { count: 42 }], ["cameraShake", 0, { strength: 0.9 }]]),
  recipe("ender-teleport", "Ender teleport", "magic", "Purple teleport, corruption wisps and screen glitch.", [["magicTeleport", 0, { color: "#b45cff", radius: 1.8 }], ["magicCorruption", 0, { color: "#7d3cff" }], ["screenGlitch", 0, { strength: 0.5 }]]),
  recipe("nether-portal", "Nether portal", "magic", "Portal bloom, particles and Nether ambience.", [["magicPortal", 0, { color: "#8f2cff", radius: 2.5 }], ["environmentNether", 0, { intensity: 0.5 }], ["screenBloom", 2, { alpha: 0.35 }]]),
  recipe("critical-hit", "Critical hit", "combat", "Minecraft critical burst, impact frame and hit stop.", [["criticalHit", 0, { count: 52 }], ["impactFrame", 0, { contrast: 1.8 }], ["hitStop", 0, { alpha: 0.3 }], ["cameraShake", 0, { strength: 0.7 }]]),
  recipe("sword-clash", "Sword clash", "combat", "Sparks, slash trails and parry burst.", [["combatSparks", 0, { count: 36 }], ["swordSlash", -2, { intensity: 0.9 }], ["parryBurst", 0, { radius: 1.4 }], ["cameraShake", 0, { strength: 0.45 }]]),
  recipe("bow-impact", "Arrow impact", "combat", "Projectile trail ending in impact sparks and dust.", [["movementProjectileTrail", -5, { intensity: 0.8 }], ["combatImpact", 0, { intensity: 0.8 }], ["debrisBurst", 0, { count: 12 }]]),
  recipe("lightning-storm", "Lightning storm", "environment", "Lightning, rain, flash and thunder shake.", [["environmentStorm", 0, { intensity: 0.7 }], ["lightningStrike", 6, { radius: 4 }], ["flash", 6, { alpha: 0.85 }], ["cameraShake", 7, { strength: 0.5 }]]),
  recipe("magic-charge", "Magic charge", "magic", "Aura, power-up spiral, sparks and bloom.", [["magicPowerUp", 0, { radius: 2.2, count: 48 }], ["magicAura", 0, { radius: 1.7 }], ["electricSparks", 4, { count: 20 }], ["screenBloom", 8, { alpha: 0.4 }]]),
  recipe("boss-spawn", "Boss spawn", "cinematic", "Ground slam, corruption, fog and cinematic shake.", [["groundSlam", 0, { radius: 5 }], ["magicCorruption", 0, { radius: 3.5 }], ["fogPulse", 2, { intensity: 0.8 }], ["cinematicFrameBars", 0, { intensity: 1 }], ["cameraShake", 0, { strength: 1 }]]),
  recipe("elytra-boost", "Elytra boost", "minecraft", "Elytra trail, dash streak and speed lines.", [["movementElytraTrail", 0, { intensity: 1 }], ["movementDash", 0, { intensity: 1.2 }], ["speedLines", 0, { speed: 1.7, alpha: 0.45 }]]),
  recipe("underwater-burst", "Underwater burst", "environment", "Swimming trail, bubbles-like glow and blue pulse.", [["movementSwimmingTrail", 0, { color: "#55cfff" }], ["glowBurst", 0, { color: "#8ae8ff", count: 30 }], ["fogPulse", 0, { color: "#2b7ea8", intensity: 0.5 }]]),
  recipe("snow-gust", "Snow gust", "environment", "Directional snow and a cold fog pulse.", [["environmentSnow", 0, { intensity: 0.9, direction: "left" }], ["environmentFog", 0, { color: "#d9efff", intensity: 0.35 }]]),
  recipe("ash-fall", "Ash fall", "environment", "Ash particles, embers and smoky atmosphere.", [["environmentAsh", 0, { intensity: 0.8 }], ["emberBurst", 4, { count: 12 }], ["smokePlume", 0, { intensity: 0.5 }]]),
  recipe("cinematic-impact", "Cinematic impact", "cinematic", "Impact frame, flash, shake and chromatic glitch.", [["impactFrame", 0, { contrast: 2 }], ["nativeScreenFlash", 0, { alpha: 0.8 }], ["cameraShake", 0, { strength: 0.95 }], ["screenGlitch", 1, { strength: 0.35 }]]),
  recipe("dream-reveal", "Dream reveal", "cinematic", "Soft glow, bloom, fireflies and fog reveal.", [["glowBurst", 0, { color: "#dfc8ff", count: 42 }], ["screenBloom", 0, { alpha: 0.55 }], ["environmentFireflies", 0, { intensity: 0.7 }], ["fogPulse", 0, { color: "#cab6f5", intensity: 0.35 }]]),
  recipe("horror-presence", "Horror presence", "cinematic", "Vignette, color drain, glitch and creeping fog.", [["nativeVignette", 0, { intensity: 0.8 }], ["colorDrain", 0, { alpha: 0.45 }], ["screenGlitch", 5, { strength: 0.25 }], ["environmentFog", 0, { color: "#151b22", intensity: 0.65 }]])
];

export function getQuickVfxRecipe(id: QuickVfxPresetId): QuickVfxRecipe {
  return QUICK_VFX_RECIPES.find((candidate) => candidate.id === id) ?? QUICK_VFX_RECIPES[0];
}

export function insertQuickVfx(project: MineMotionProject, presetId: QuickVfxPresetId, options: InsertQuickVfxOptions): QuickVfxInsertResult {
  const recipeDefinition = getQuickVfxRecipe(presetId);
  if (project.effects.instances.length + recipeDefinition.effects.length > MAX_EFFECT_INSTANCES) {
    return { project, changed: false, effectIds: [], error: "QUICK_VFX_EFFECT_LIMIT_REACHED" };
  }
  const frame = Math.max(0, Math.round(options.frame));
  const intensity = clamp(options.intensity ?? 1, 0.05, 8);
  const durationScale = clamp(options.durationScale ?? 1, 0.1, 8);
  const position = options.position ? sanitizePosition(options.position) : resolveTargetPosition(project, options.targetObjectId);
  const instances: EffectInstance[] = recipeDefinition.effects.map((entry) => {
    const base = spawnEffectAtFrame(entry.type, Math.max(0, frame + entry.offset), options.targetObjectId ?? "");
    return {
      ...base,
      name: `${recipeDefinition.name} · ${base.name}`,
      durationFrames: Math.max(1, Math.round(base.durationFrames * durationScale * (entry.durationScale ?? 1))),
      position: [...position],
      parameters: {
        ...base.parameters,
        ...entry.parameters,
        intensity: clamp((entry.parameters?.intensity ?? base.parameters.intensity ?? 1) * intensity, 0.01, 16)
      }
    };
  });
  const next = syncCinematicTimeline({
    ...project,
    effects: { ...project.effects, instances: [...project.effects.instances, ...instances] },
    animation: { ...project.animation, durationFrames: Math.max(project.animation.durationFrames, ...instances.map((effect) => effect.startFrame + effect.durationFrames + 1)) },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  });
  return { project: next, changed: true, effectIds: instances.map((instance) => instance.id), error: null };
}

export function addQuickVfxFavorite(
  project: MineMotionProject,
  presetId: QuickVfxPresetId,
  name = getQuickVfxRecipe(presetId).name,
  intensity = 1,
  durationScale = 1
): MineMotionProject {
  const id = `quick_vfx_${presetId}`;
  const favorite: QuickVfxFavorite = { id, presetId, name: name.trim().slice(0, 120) || getQuickVfxRecipe(presetId).name, intensity: clamp(intensity, 0.05, 8), durationScale: clamp(durationScale, 0.1, 8) };
  return {
    ...project,
    creationSuite: {
      ...project.creationSuite,
      quickVfxFavorites: [...project.creationSuite.quickVfxFavorites.filter((entry) => entry.id !== id), favorite].slice(-64)
    },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  };
}

export function removeQuickVfxFavorite(project: MineMotionProject, favoriteId: string): MineMotionProject {
  return {
    ...project,
    creationSuite: { ...project.creationSuite, quickVfxFavorites: project.creationSuite.quickVfxFavorites.filter((entry) => entry.id !== favoriteId) },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  };
}

export function insertQuickVfxFavorite(project: MineMotionProject, favoriteId: string, frame: number, targetObjectId = ""): QuickVfxInsertResult {
  const favorite = project.creationSuite.quickVfxFavorites.find((entry) => entry.id === favoriteId);
  if (!favorite || !QUICK_VFX_PRESET_IDS.includes(favorite.presetId as QuickVfxPresetId)) return { project, changed: false, effectIds: [], error: "QUICK_VFX_FAVORITE_MISSING" };
  return insertQuickVfx(project, favorite.presetId as QuickVfxPresetId, { frame, targetObjectId, intensity: favorite.intensity, durationScale: favorite.durationScale });
}

export function removeEffectsAtFrame(project: MineMotionProject, frame: number, toleranceFrames = 1): MineMotionProject {
  const center = Math.max(0, Math.round(frame));
  const tolerance = Math.max(0, Math.round(toleranceFrames));
  const instances = project.effects.instances.filter((effect) => Math.abs(effect.startFrame - center) > tolerance);
  return syncCinematicTimeline({ ...project, effects: { ...project.effects, instances }, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } });
}

export function exportQuickVfxCatalog(project: MineMotionProject): string {
  return JSON.stringify({ format: "minemotion-quick-vfx-v1", recipes: QUICK_VFX_RECIPES, favorites: project.creationSuite.quickVfxFavorites }, null, 2);
}

function recipe(id: QuickVfxPresetId, name: string, category: QuickVfxRecipe["category"], description: string, effects: readonly [EffectType, number, Partial<EffectParameters>?][]): QuickVfxRecipe {
  return { id, name, category, description, effects: effects.map(([type, offset, parameters]) => ({ type, offset, parameters })) };
}
function resolveTargetPosition(project: MineMotionProject, targetObjectId = ""): Vector3Tuple {
  const entity = [...project.scene.characters, ...project.scene.cameras, ...project.scene.importedObjects, ...project.scene.lights].find((candidate) => candidate.id === targetObjectId);
  return entity ? [...entity.transform.position] : [0, 1, 0];
}
function sanitizePosition(value: Vector3Tuple): Vector3Tuple { return value.map((part) => clamp(Number.isFinite(part) ? part : 0, -30_000_000, 30_000_000)) as Vector3Tuple; }
function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
