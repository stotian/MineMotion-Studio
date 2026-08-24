import type { EffectParameters, EffectType } from "../../effects/EffectTypes";
import type { BuiltinVfxPresetCategory } from "./BuiltinVfxPresetTypes";

/**
 * Named VFX variants.
 *
 * The catalogue derives exactly one entry per effect type from its
 * defaultParameters, so the library is as wide as the engine but only one
 * preset deep. A variant is that same effect with tuned parameters and its own
 * name — "Explosion, small" versus "Explosion, massive" — which is how an
 * effects library is normally browsed.
 *
 * Every variant names an effect type that exists in EffectRegistry; a test
 * pins that, so a renamed effect fails the build rather than producing an
 * entry that silently does nothing when clicked.
 */
export interface VfxVariant {
  id: string;
  name: string;
  description: string;
  category: BuiltinVfxPresetCategory;
  effectType: EffectType;
  /** Overrides merged over the effect's defaultParameters. */
  parameters: EffectParameters;
  /** Optional duration override, in frames. */
  durationFrames?: number;
}

function variant(
  id: string,
  name: string,
  description: string,
  category: BuiltinVfxPresetCategory,
  effectType: EffectType,
  parameters: EffectParameters,
  durationFrames?: number
): VfxVariant {
  return { id, name, description, category, effectType, parameters, durationFrames };
}

/* ------------------------------ combat ------------------------------ */

const COMBAT: VfxVariant[] = [
  variant("combat-spark-light", "Sparks, light", "A few sparks from a glancing blow.", "combat", "combatSparks", { count: 12, radius: 0.25, speed: 2.4, intensity: 0.7 }, 12),
  variant("combat-spark-heavy", "Sparks, heavy", "A dense shower from a solid hit.", "combat", "combatSparks", { count: 60, radius: 0.6, speed: 5.2, intensity: 1.8 }, 20),
  variant("combat-spark-cold", "Sparks, cold steel", "Blue-white sparks on armour.", "combat", "combatSparks", { color: "#cfe6ff", count: 34, radius: 0.4, speed: 4.4, intensity: 1.4 }, 16),
  variant("combat-impact-soft", "Impact, soft", "A muted body blow.", "combat", "combatImpact", { radius: 0.5, alpha: 0.6, intensity: 0.6 }, 10),
  variant("combat-impact-brutal", "Impact, brutal", "A heavy, wide impact.", "combat", "combatImpact", { radius: 1.8, alpha: 1, intensity: 2.2 }, 18),
  variant("slash-quick", "Slash, quick", "A short fast arc.", "combat", "swordSlash", { radius: 1.1, size: 0.1, alpha: 0.85 }, 8),
  variant("slash-wide", "Slash, wide", "A long sweeping arc.", "combat", "swordSlash", { radius: 2.6, size: 0.24, alpha: 1 }, 16),
  variant("slash-crimson", "Slash, crimson", "A deep red blade trail.", "combat", "swordSlash", { color: "#e03a3a", radius: 2.0, size: 0.2 }, 14),
  variant("parry-small", "Parry, small", "A tight deflection flash.", "combat", "parryBurst", { radius: 0.6, intensity: 0.9 }, 8),
  variant("parry-perfect", "Parry, perfect", "A bright, wide deflection.", "combat", "parryBurst", { color: "#ffe9a3", radius: 1.6, intensity: 2.4 }, 14),
  variant("slam-ground", "Ground slam", "A shockwave along the floor.", "combat", "groundSlam", { radius: 3.4, intensity: 1.6 }, 22),
  variant("slam-titan", "Titan slam", "An enormous ground rupture.", "combat", "groundSlam", { radius: 7, intensity: 3, count: 90 }, 32),
  variant("landing-light", "Landing, light", "A puff from a short drop.", "combat", "landingDust", { radius: 0.9, count: 20, alpha: 0.45 }, 16),
  variant("landing-crash", "Landing, crash", "A big cloud from a long fall.", "combat", "landingDust", { radius: 3.2, count: 70, alpha: 0.8 }, 30),
  variant("crit-standard", "Critical hit", "The classic critical sparkle.", "combat", "criticalHit", { count: 24, intensity: 1.4 }, 14),
  variant("crit-massive", "Critical, massive", "An oversized critical burst.", "combat", "criticalHit", { color: "#ffd166", count: 64, radius: 1.2, intensity: 2.6 }, 22),
  variant("hitstop-brief", "Hit stop, brief", "A two-frame freeze.", "combat", "hitStop", { intensity: 0.6 }, 2),
  variant("hitstop-long", "Hit stop, long", "A held dramatic freeze.", "combat", "hitStop", { intensity: 1.6 }, 8)
];

/* --------------------------- fire & explosion --------------------------- */

const FIRE: VfxVariant[] = [
  variant("explosion-tiny", "Explosion, tiny", "A firecracker-scale pop.", "fire-explosion", "nativeExplosion", { radius: 1.2, count: 22, speed: 3, intensity: 0.9 }, 14),
  variant("explosion-standard", "Explosion, standard", "A creeper-scale blast.", "fire-explosion", "nativeExplosion", { radius: 4, count: 64, speed: 5, intensity: 2 }, 24),
  variant("explosion-massive", "Explosion, massive", "A TNT-cluster detonation.", "fire-explosion", "nativeExplosion", { radius: 9, count: 140, speed: 8, intensity: 3.4, size: 0.3 }, 36),
  variant("explosion-blue", "Explosion, blue", "A cold arcane detonation.", "fire-explosion", "nativeExplosion", { color: "#5ec8ff", secondaryColor: "#d8f4ff", radius: 5, count: 80, intensity: 2.4 }, 28),
  variant("fire-candle", "Fire, candle", "A single small flame.", "fire-explosion", "nativeFire", { radius: 0.2, count: 8, size: 0.05, intensity: 0.5 }, 60),
  variant("fire-campfire", "Fire, campfire", "A steady contained fire.", "fire-explosion", "nativeFire", { radius: 0.6, count: 26, intensity: 1 }, 60),
  variant("fire-bonfire", "Fire, bonfire", "A tall roaring fire.", "fire-explosion", "nativeFire", { radius: 1.6, count: 70, size: 0.2, speed: 2.6, intensity: 2 }, 60),
  variant("fire-inferno", "Fire, inferno", "A wall of flame.", "fire-explosion", "nativeFire", { radius: 4, count: 150, size: 0.26, speed: 3, intensity: 3 }, 60),
  variant("smoke-wisp", "Smoke, wisp", "A thin trailing wisp.", "fire-explosion", "smokePlume", { radius: 0.3, count: 14, alpha: 0.3, speed: 0.8 }, 60),
  variant("smoke-column", "Smoke, column", "A rising column of smoke.", "fire-explosion", "smokePlume", { radius: 1.1, count: 48, alpha: 0.55, speed: 1.6 }, 60),
  variant("smoke-black", "Smoke, black", "Heavy oil-black smoke.", "fire-explosion", "smokePlume", { color: "#2b2b2b", radius: 1.8, count: 70, alpha: 0.75 }, 60),
  variant("embers-few", "Embers, few", "A scatter of drifting embers.", "fire-explosion", "emberBurst", { count: 14, radius: 0.5, speed: 1.6 }, 40),
  variant("embers-storm", "Embers, storm", "A dense swirl of embers.", "fire-explosion", "emberBurst", { count: 90, radius: 2.2, speed: 3.4 }, 48),
  variant("debris-light", "Debris, light", "A few blocks thrown out.", "fire-explosion", "debrisBurst", { count: 16, radius: 0.3, speed: 3 }, 24),
  variant("debris-heavy", "Debris, heavy", "A wide block scatter.", "fire-explosion", "debrisBurst", { count: 90, radius: 0.9, speed: 6, size: 0.3 }, 36),
  variant("dust-thin", "Dust, thin", "A light ground haze.", "fire-explosion", "dustCloud", { radius: 1.4, count: 26, alpha: 0.3 }, 40),
  variant("dust-billow", "Dust, billowing", "A thick rolling cloud.", "fire-explosion", "dustCloud", { radius: 5, count: 110, alpha: 0.7, speed: 2 }, 60),
  variant("nether-flame", "Nether flame", "A deep red Nether fire.", "fire-explosion", "netherFire", { radius: 1.3, count: 46 }, 60),
  variant("nether-blaze", "Nether blaze", "A raging Nether column.", "fire-explosion", "netherFire", { radius: 3, count: 110, speed: 2.8, intensity: 2.4 }, 60),
  variant("soul-flame-low", "Soul flame, low", "A quiet soul fire.", "fire-explosion", "soulFire", { radius: 0.7, count: 24, intensity: 0.8 }, 60),
  variant("soul-flame-high", "Soul flame, high", "A towering soul fire.", "fire-explosion", "soulFire", { radius: 2.2, count: 80, speed: 2.4, intensity: 2 }, 60)
];

/* --------------------------- lightning & electric --------------------------- */

const ELECTRIC: VfxVariant[] = [
  variant("bolt-thin", "Bolt, thin", "A slender lightning strike.", "lightning-electric", "lightningStrike", { radius: 1.4, intensity: 1, alpha: 0.9 }, 10),
  variant("bolt-heavy", "Bolt, heavy", "A thick, blinding strike.", "lightning-electric", "lightningStrike", { radius: 4.2, intensity: 3, alpha: 1, flash: true }, 16),
  variant("bolt-violet", "Bolt, violet", "A purple arcane bolt.", "lightning-electric", "lightningStrike", { color: "#c08bff", radius: 2.6, intensity: 2 }, 14),
  variant("storm-distant", "Storm, distant", "Occasional far-off flashes.", "lightning-electric", "electricStorm", { radius: 8, intensity: 0.8, alpha: 0.7 }, 60),
  variant("storm-overhead", "Storm, overhead", "A violent storm directly above.", "lightning-electric", "electricStorm", { radius: 4, intensity: 2.6, alpha: 1 }, 60),
  variant("beam-focused", "Beam, focused", "A tight continuous arc.", "lightning-electric", "electricBeam", { size: 0.08, intensity: 1.6 }, 30),
  variant("beam-wide", "Beam, wide", "A broad crackling beam.", "lightning-electric", "electricBeam", { size: 0.26, intensity: 2.8, radius: 9 }, 30),
  variant("aura-faint", "Aura, faint", "A subtle charged shimmer.", "lightning-electric", "electricAura", { radius: 0.7, count: 18, alpha: 0.5 }, 60),
  variant("aura-crackling", "Aura, crackling", "An angry electric shell.", "lightning-electric", "electricAura", { radius: 1.8, count: 70, alpha: 1, intensity: 2.2 }, 60),
  variant("charge-slow", "Charge, slow", "A long build-up.", "lightning-electric", "electricCharge", { speed: 0.8, intensity: 1 }, 48),
  variant("charge-fast", "Charge, fast", "A snap charge before release.", "lightning-electric", "electricCharge", { speed: 3.2, intensity: 2.2 }, 14),
  variant("sparks-small", "Electric sparks, small", "A few loose arcs.", "lightning-electric", "electricSparks", { count: 14, radius: 0.3 }, 16),
  variant("sparks-shower", "Electric sparks, shower", "A cascade of arcs.", "lightning-electric", "electricSparks", { count: 80, radius: 1.1, speed: 4 }, 26),
  variant("chain-short", "Chain, short", "A two-target chain.", "lightning-electric", "chainLightning", { radius: 2.5, intensity: 1.1 }, 18),
  variant("chain-long", "Chain, long", "A chain that leaps far.", "lightning-electric", "chainLightning", { radius: 9, intensity: 2.2 }, 30),
  variant("weapon-arc", "Weapon arc", "An electrified blade trail.", "lightning-electric", "electricWeaponTrail", { radius: 1.4, intensity: 1.6 }, 20)
];

/* ------------------------------ magic ------------------------------ */

const MAGIC: VfxVariant[] = [
  variant("aura-heal", "Aura, healing", "A gentle green restorative glow.", "magic-energy", "magicAura", { color: "#7dfc9a", radius: 1, alpha: 0.7, intensity: 1 }, 60),
  variant("aura-dark", "Aura, dark", "A creeping shadow aura.", "magic-energy", "magicAura", { color: "#6b3fa0", radius: 1.4, alpha: 0.8, intensity: 1.4 }, 60),
  variant("aura-holy", "Aura, holy", "A bright golden nimbus.", "magic-energy", "magicAura", { color: "#ffe89a", radius: 1.6, alpha: 0.9, intensity: 2 }, 60),
  variant("beam-lance", "Beam, lance", "A thin piercing ray.", "magic-energy", "magicBeam", { size: 0.06, intensity: 2, radius: 9 }, 20),
  variant("beam-cannon", "Beam, cannon", "A wide devastating beam.", "magic-energy", "magicBeam", { size: 0.5, intensity: 3.2, radius: 2 }, 34),
  variant("projectile-fast", "Projectile, fast", "A quick darting bolt.", "magic-energy", "magicProjectile", { radius: 7, size: 0.1 }, 16),
  variant("projectile-heavy", "Projectile, heavy", "A slow, massive orb.", "magic-energy", "magicProjectile", { radius: 2.5, size: 0.4, intensity: 2 }, 40),
  variant("portal-small", "Portal, small", "A pocket rift.", "magic-energy", "magicPortal", { radius: 0.8, count: 30 }, 60),
  variant("portal-gateway", "Portal, gateway", "A full-height gateway.", "magic-energy", "magicPortal", { radius: 2.6, count: 90, intensity: 2 }, 60),
  variant("teleport-in", "Teleport, arrive", "A condensing arrival.", "magic-energy", "magicTeleport", { speed: 3, intensity: 1.6 }, 18),
  variant("teleport-out", "Teleport, depart", "A scattering departure.", "magic-energy", "magicTeleport", { speed: 5, intensity: 2.2, radius: 1.4 }, 18),
  variant("heal-pulse", "Heal pulse", "A single restorative pulse.", "magic-energy", "magicHeal", { radius: 1.2, intensity: 1.2 }, 20),
  variant("heal-channel", "Heal channel", "A sustained healing stream.", "magic-energy", "magicHeal", { radius: 0.8, intensity: 0.8 }, 60),
  variant("corruption-creep", "Corruption, creeping", "Slow spreading blight.", "magic-energy", "magicCorruption", { speed: 0.7, radius: 1.6, alpha: 0.7 }, 60),
  variant("corruption-burst", "Corruption, burst", "A violent blight eruption.", "magic-energy", "magicCorruption", { speed: 3.4, radius: 3.4, intensity: 2.4 }, 30),
  variant("glow-soft", "Glow burst, soft", "A quiet pulse of light.", "magic-energy", "glowBurst", { radius: 0.8, alpha: 0.5 }, 16),
  variant("glow-nova", "Glow burst, nova", "A blinding radial flash.", "magic-energy", "glowBurst", { radius: 4, alpha: 1, intensity: 3 }, 24)
];

/* ---------------------------- environment ---------------------------- */

const ENVIRONMENT: VfxVariant[] = [
  variant("rain-drizzle", "Rain, drizzle", "A light scatter of drops.", "environment", "environmentRain", { count: 120, speed: 5, alpha: 0.35 }, 60),
  variant("rain-steady", "Rain, steady", "Consistent rainfall.", "environment", "environmentRain", { count: 320, speed: 8, alpha: 0.55 }, 60),
  variant("rain-downpour", "Rain, downpour", "A heavy driving storm.", "environment", "environmentRain", { count: 700, speed: 13, alpha: 0.75 }, 60),
  variant("fog-thin", "Fog, thin", "A faint haze.", "environment", "environmentFog", { alpha: 0.18, radius: 6 }, 60),
  variant("fog-thick", "Fog, thick", "Dense low-visibility fog.", "environment", "environmentFog", { alpha: 0.6, radius: 14 }, 60),
  variant("fog-eerie", "Fog, eerie", "A cold green-tinted mist.", "environment", "environmentFog", { color: "#9fc8b4", alpha: 0.4, radius: 10 }, 60),
  variant("dust-motes", "Dust motes", "Slow motes in a sunbeam.", "environment", "environmentDust", { count: 60, speed: 0.4, alpha: 0.35 }, 60),
  variant("dust-sandstorm", "Sandstorm", "Fast wind-driven grit.", "environment", "environmentDust", { color: "#d9c08a", count: 400, speed: 6, alpha: 0.6 }, 60),
  variant("ash-light", "Ash, light", "A few falling flakes.", "environment", "environmentAsh", { count: 60, speed: 0.9 }, 60),
  variant("ash-heavy", "Ash, heavy", "Thick volcanic fallout.", "environment", "environmentAsh", { count: 340, speed: 1.8, alpha: 0.7 }, 60),
  variant("fireflies-sparse", "Fireflies, sparse", "A handful of drifting lights.", "environment", "environmentFireflies", { count: 14, radius: 4 }, 60),
  variant("fireflies-swarm", "Fireflies, swarm", "A dense glowing swarm.", "environment", "environmentFireflies", { count: 90, radius: 7 }, 60),
  variant("cave-ambience", "Cave ambience", "Still, damp cave particles.", "environment", "environmentCave", { count: 40, alpha: 0.4 }, 60),
  variant("nether-ambience", "Nether ambience", "Drifting Nether embers.", "environment", "environmentNether", { count: 70 }, 60),
  variant("end-ambience", "End ambience", "Sparse End void motes.", "environment", "environmentEnd", { count: 50 }, 60),
  variant("fog-pulse-slow", "Fog pulse, slow", "A slow breathing fog swell.", "environment", "fogPulse", { alpha: 0.4, intensity: 0.6 }, 60),
  variant("fog-pulse-fast", "Fog pulse, fast", "A rapid fog surge.", "environment", "fogPulse", { alpha: 0.6, intensity: 2.6 }, 30)
];

/* -------------------------- screen & cinematic -------------------------- */

const SCREEN: VfxVariant[] = [
  variant("shake-subtle", "Shake, subtle", "A barely-there tremor.", "screen-cinematic", "cameraShake", { strength: 0.25, frequency: 6, decay: 1.2 }, 14),
  variant("shake-impact", "Shake, impact", "A sharp single jolt.", "screen-cinematic", "cameraShake", { strength: 1.2, frequency: 14, decay: 2.4 }, 8),
  variant("shake-earthquake", "Shake, earthquake", "A long violent rumble.", "screen-cinematic", "cameraShake", { strength: 2.2, frequency: 9, decay: 0.4 }, 60),
  variant("flash-white", "Flash, white", "A clean white blink.", "screen-cinematic", "flash", { color: "#ffffff", alpha: 1 }, 6),
  variant("flash-soft", "Flash, soft", "A gentle wash of light.", "screen-cinematic", "flash", { color: "#fff3d0", alpha: 0.5 }, 14),
  variant("flash-red", "Flash, damage", "A red damage blink.", "screen-cinematic", "flash", { color: "#ff4d4d", alpha: 0.7 }, 8),
  variant("vignette-tight", "Vignette, tight", "A strong closing vignette.", "screen-cinematic", "vignettePulse", { intensity: 2, alpha: 0.9 }, 24),
  variant("vignette-breathe", "Vignette, breathing", "A slow pulsing vignette.", "screen-cinematic", "vignettePulse", { intensity: 0.8, alpha: 0.5 }, 60),
  variant("bars-cinema", "Bars, 2.35:1", "Classic anamorphic bars.", "screen-cinematic", "cinematicBars", { intensity: 1 }, 60),
  variant("bars-thin", "Bars, thin", "Subtle letterboxing.", "screen-cinematic", "cinematicBars", { intensity: 0.5 }, 60),
  variant("impact-frame", "Impact frame", "A single stylised hit frame.", "screen-cinematic", "impactFrame", { intensity: 1.4 }, 3),
  variant("drain-partial", "Colour drain, partial", "Desaturate toward grey.", "screen-cinematic", "colorDrain", { intensity: 0.5 }, 30),
  variant("drain-full", "Colour drain, full", "Drop fully to black and white.", "screen-cinematic", "colorDrain", { intensity: 1 }, 30),
  variant("grade-warm", "Grade, warm", "Push toward golden hour.", "screen-cinematic", "colorGradeKeyframe", { saturation: 1.25, contrast: 1.1, intensity: 0.6 }, 60),
  variant("grade-cold", "Grade, cold", "Push toward moonlit blue.", "screen-cinematic", "colorGradeKeyframe", { saturation: 0.7, contrast: 1.15, intensity: 0.6 }, 60),
  variant("grade-nether", "Grade, Nether", "Push toward hot red.", "screen-cinematic", "colorGradeKeyframe", { saturation: 1.4, contrast: 1.25, intensity: 0.7 }, 60)
];

/* --------------------------- movement & trails --------------------------- */

const MOVEMENT: VfxVariant[] = [
  variant("speed-light", "Speed lines, light", "A hint of motion.", "movement-trails", "speedLines", { alpha: 0.3, speed: 5, intensity: 0.6 }, 16),
  variant("speed-intense", "Speed lines, intense", "Full anime-style rush.", "movement-trails", "speedLines", { alpha: 0.8, speed: 12, intensity: 2.2 }, 20),
  variant("shockwave-small", "Shockwave, small", "A tight ring.", "movement-trails", "shockwave", { radius: 1.2, intensity: 1 }, 14),
  variant("shockwave-huge", "Shockwave, huge", "A vast expanding ring.", "movement-trails", "shockwave", { radius: 8, intensity: 2.4, alpha: 1 }, 28)
];

export const VFX_VARIANTS: readonly VfxVariant[] = Object.freeze([
  ...COMBAT,
  ...FIRE,
  ...ELECTRIC,
  ...MAGIC,
  ...ENVIRONMENT,
  ...SCREEN,
  ...MOVEMENT
]);

const VARIANT_IDS = new Set(VFX_VARIANTS.map((entry) => entry.id));
if (VARIANT_IDS.size !== VFX_VARIANTS.length) {
  throw new RangeError("VFX variant IDs must be unique.");
}

/** Variants grouped by category, for the library's category filter. */
export function listVfxVariantsByCategory(
  category: BuiltinVfxPresetCategory
): readonly VfxVariant[] {
  return VFX_VARIANTS.filter((entry) => entry.category === category);
}
