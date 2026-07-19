import { BUILTIN_EFFECTS } from "../../effects/EffectRegistry";
import type { EffectDefinition, EffectType } from "../../effects/EffectTypes";
import { CURRENT_PROJECT_SCHEMA_VERSION } from "../../core/serialization/SchemaVersion";
import { createLegacyVfxRegistry } from "../compat/LegacyEffectAdapter";
import { VfxRegistry } from "../core/VfxRegistry";
import { measureLegacyVfxEffectWork } from "../runtime/VfxFrameBudget";
import { listBuiltinVfxRecipes } from "../recipes/BuiltinVfxRecipeRegistry";
import {
  BUILTIN_VFX_PRESET_METADATA_VERSION,
  type BuiltinVfxPreset,
  type BuiltinVfxPresetCategory,
  type BuiltinVfxPresetMetadata
} from "./BuiltinVfxPresetTypes";
import { validateBuiltinVfxPresetCatalog } from "./BuiltinVfxPresetValidator";

const CATEGORY_BY_EFFECT: Record<EffectType, BuiltinVfxPresetCategory> = {
  lightningStrike: "lightning-electric",
  impactFrame: "combat",
  cameraShake: "screen-cinematic",
  flash: "screen-cinematic",
  speedLines: "movement-trails",
  shockwave: "combat",
  glowBurst: "magic-energy",
  fogPulse: "environment",
  vignettePulse: "screen-cinematic",
  colorGradeKeyframe: "screen-cinematic",
  cinematicBars: "screen-cinematic",
  explosionFlash: "fire-explosion",
  combatSparks: "combat",
  combatImpact: "combat",
  swordSlash: "combat",
  parryBurst: "combat",
  groundSlam: "combat",
  landingDust: "combat",
  criticalHit: "combat",
  hitStop: "combat",
  electricStrike: "lightning-electric",
  electricStorm: "lightning-electric",
  electricBeam: "lightning-electric",
  electricAura: "lightning-electric",
  electricCharge: "lightning-electric",
  electricSparks: "lightning-electric",
  chainLightning: "lightning-electric",
  electricWeaponTrail: "lightning-electric",
  nativeFire: "fire-explosion",
  smokePlume: "fire-explosion",
  nativeExplosion: "fire-explosion",
  emberBurst: "fire-explosion",
  debrisBurst: "fire-explosion",
  dustCloud: "fire-explosion",
  netherFire: "fire-explosion",
  soulFire: "fire-explosion",
  magicAura: "magic-energy",
  magicBeam: "magic-energy",
  magicProjectile: "magic-energy",
  magicPortal: "magic-energy",
  magicTeleport: "magic-energy",
  magicHeal: "magic-energy",
  magicCorruption: "magic-energy",
  magicPowerUp: "magic-energy",
  environmentRain: "environment",
  environmentSnow: "environment",
  environmentAsh: "environment",
  environmentFog: "environment",
  environmentDust: "environment",
  environmentStorm: "environment",
  environmentEnd: "environment",
  environmentNether: "environment",
  environmentCave: "environment",
  environmentFireflies: "environment",
  nativeScreenFlash: "screen-cinematic",
  nativeScreenShake: "screen-cinematic",
  screenGlitch: "screen-cinematic",
  cinematicFrameBars: "screen-cinematic",
  screenBloom: "screen-cinematic",
  nativeVignette: "screen-cinematic",
  cinematicFreeze: "screen-cinematic",
  colorDrain: "screen-cinematic",
  movementDash: "movement-trails",
  movementWeaponTrail: "movement-trails",
  movementProjectileTrail: "movement-trails",
  movementFootsteps: "movement-trails",
  movementRunning: "movement-trails",
  movementFalling: "movement-trails",
  movementFlying: "movement-trails",
  movementElytraTrail: "movement-trails",
  movementEnderPearlTrail: "movement-trails",
  movementSwimmingTrail: "movement-trails"
};

const CAPABILITIES_BY_EFFECT: Record<
  EffectType,
  { preview: boolean; export: boolean; limitations: readonly string[] }
> = {
  lightningStrike: { preview: true, export: true, limitations: ["Some compatibility parameters are stored but not visualized."] },
  impactFrame: { preview: true, export: true, limitations: ["Uses the compatibility overlay renderer."] },
  cameraShake: { preview: true, export: true, limitations: ["Uses the compatibility camera renderer."] },
  flash: { preview: true, export: true, limitations: ["Uses the compatibility overlay renderer."] },
  speedLines: { preview: true, export: true, limitations: ["Uses fixed compatibility line geometry."] },
  shockwave: { preview: true, export: true, limitations: ["Uses compatibility Three.js ring geometry."] },
  glowBurst: { preview: true, export: true, limitations: ["Uses compatibility instanced cube particles."] },
  fogPulse: { preview: true, export: false, limitations: ["Animated fog pulse is currently preview-only."] },
  vignettePulse: { preview: false, export: true, limitations: ["Animated vignette pulse is currently export-only."] },
  colorGradeKeyframe: { preview: false, export: false, limitations: ["Stored timeline marker; no visual runtime is connected."] },
  cinematicBars: { preview: true, export: true, limitations: ["Uses the compatibility overlay renderer."] },
  explosionFlash: { preview: true, export: true, limitations: ["Uses the compatibility overlay renderer."] },
  combatSparks: { preview: true, export: true, limitations: [] },
  combatImpact: { preview: true, export: true, limitations: [] },
  swordSlash: { preview: true, export: true, limitations: [] },
  parryBurst: { preview: true, export: true, limitations: [] },
  groundSlam: { preview: true, export: true, limitations: [] },
  landingDust: { preview: true, export: true, limitations: [] },
  criticalHit: { preview: true, export: true, limitations: [] },
  hitStop: { preview: true, export: true, limitations: ["Pose hold affects animated scene sampling; audio playback is not paused."] },
  electricStrike: { preview: true, export: true, limitations: [] },
  electricStorm: { preview: true, export: true, limitations: [] },
  electricBeam: { preview: true, export: true, limitations: [] },
  electricAura: { preview: true, export: true, limitations: [] },
  electricCharge: { preview: true, export: true, limitations: [] },
  electricSparks: { preview: true, export: true, limitations: [] },
  chainLightning: { preview: true, export: true, limitations: [] },
  electricWeaponTrail: { preview: true, export: true, limitations: [] },
  nativeFire: { preview: true, export: true, limitations: [] },
  smokePlume: { preview: true, export: true, limitations: [] },
  nativeExplosion: { preview: true, export: true, limitations: [] },
  emberBurst: { preview: true, export: true, limitations: [] },
  debrisBurst: { preview: true, export: true, limitations: [] },
  dustCloud: { preview: true, export: true, limitations: [] },
  netherFire: { preview: true, export: true, limitations: [] },
  soulFire: { preview: true, export: true, limitations: [] },
  magicAura: { preview: true, export: true, limitations: [] },
  magicBeam: { preview: true, export: true, limitations: [] },
  magicProjectile: { preview: true, export: true, limitations: [] },
  magicPortal: { preview: true, export: true, limitations: [] },
  magicTeleport: { preview: true, export: true, limitations: [] },
  magicHeal: { preview: true, export: true, limitations: [] },
  magicCorruption: { preview: true, export: true, limitations: [] },
  magicPowerUp: { preview: true, export: true, limitations: [] },
  environmentRain: { preview: true, export: true, limitations: ["Primitive V1 approximates directional rainfall with isotropic field motion."] },
  environmentSnow: { preview: true, export: true, limitations: ["Primitive V1 approximates directional snowfall with isotropic field motion."] },
  environmentAsh: { preview: true, export: true, limitations: ["Primitive V1 approximates directional ash fall with isotropic field motion."] },
  environmentFog: { preview: true, export: true, limitations: [] },
  environmentDust: { preview: true, export: true, limitations: [] },
  environmentStorm: { preview: true, export: true, limitations: ["Rain motion is isotropic in Primitive V1."] },
  environmentEnd: { preview: true, export: true, limitations: [] },
  environmentNether: { preview: true, export: true, limitations: [] },
  environmentCave: { preview: true, export: true, limitations: ["Droplet direction is approximated by isotropic motion."] },
  environmentFireflies: { preview: true, export: true, limitations: [] },
  nativeScreenFlash: { preview: true, export: true, limitations: [] },
  nativeScreenShake: { preview: true, export: true, limitations: [] },
  screenGlitch: { preview: true, export: true, limitations: [] },
  cinematicFrameBars: { preview: true, export: true, limitations: [] },
  screenBloom: { preview: true, export: true, limitations: [] },
  nativeVignette: { preview: true, export: true, limitations: [] },
  cinematicFreeze: { preview: true, export: true, limitations: ["Animation pose is held; audio playback continues."] },
  colorDrain: { preview: true, export: true, limitations: [] },
  movementDash: { preview: true, export: true, limitations: [] },
  movementWeaponTrail: { preview: true, export: true, limitations: [] },
  movementProjectileTrail: { preview: true, export: true, limitations: [] },
  movementFootsteps: { preview: true, export: true, limitations: [] },
  movementRunning: { preview: true, export: true, limitations: [] },
  movementFalling: { preview: true, export: true, limitations: [] },
  movementFlying: { preview: true, export: true, limitations: [] },
  movementElytraTrail: { preview: true, export: true, limitations: [] },
  movementEnderPearlTrail: { preview: true, export: true, limitations: [] },
  movementSwimmingTrail: { preview: true, export: true, limitations: [] }
};

const BUILTIN_RECIPE_ID_SET = new Set<string>(
  listBuiltinVfxRecipes().map((recipe) => recipe.id)
);
const NATIVE_FINAL_BUDGETS: Partial<Record<EffectType, { particles: number; segments: number }>> = {
  combatSparks: { particles: 28, segments: 0 },
  combatImpact: { particles: 0, segments: 72 },
  swordSlash: { particles: 0, segments: 88 },
  parryBurst: { particles: 0, segments: 92 },
  groundSlam: { particles: 48, segments: 112 },
  landingDust: { particles: 36, segments: 64 },
  criticalHit: { particles: 54, segments: 96 },
  hitStop: { particles: 0, segments: 0 },
  electricStrike: { particles: 20, segments: 72 },
  electricStorm: { particles: 0, segments: 168 },
  electricBeam: { particles: 0, segments: 96 },
  electricAura: { particles: 34, segments: 72 },
  electricCharge: { particles: 42, segments: 72 },
  electricSparks: { particles: 32, segments: 0 },
  chainLightning: { particles: 0, segments: 108 },
  electricWeaponTrail: { particles: 0, segments: 160 },
  nativeFire: { particles: 42, segments: 0 },
  smokePlume: { particles: 48, segments: 0 },
  nativeExplosion: { particles: 64, segments: 112 },
  emberBurst: { particles: 36, segments: 0 },
  debrisBurst: { particles: 44, segments: 0 },
  dustCloud: { particles: 52, segments: 72 },
  netherFire: { particles: 46, segments: 0 },
  soulFire: { particles: 46, segments: 0 },
  magicAura: { particles: 38, segments: 80 },
  magicBeam: { particles: 0, segments: 160 },
  magicProjectile: { particles: 0, segments: 96 },
  magicPortal: { particles: 44, segments: 160 },
  magicTeleport: { particles: 48, segments: 80 },
  magicHeal: { particles: 34, segments: 80 },
  magicCorruption: { particles: 42, segments: 160 },
  magicPowerUp: { particles: 56, segments: 160 },
  environmentRain: { particles: 120, segments: 0 },
  environmentSnow: { particles: 96, segments: 0 },
  environmentAsh: { particles: 84, segments: 0 },
  environmentFog: { particles: 72, segments: 0 },
  environmentDust: { particles: 76, segments: 0 },
  environmentStorm: { particles: 128, segments: 96 },
  environmentEnd: { particles: 68, segments: 80 },
  environmentNether: { particles: 76, segments: 0 },
  environmentCave: { particles: 42, segments: 0 },
  environmentFireflies: { particles: 36, segments: 0 },
  nativeScreenFlash: { particles: 0, segments: 0 },
  nativeScreenShake: { particles: 0, segments: 0 },
  screenGlitch: { particles: 0, segments: 0 },
  cinematicFrameBars: { particles: 0, segments: 0 },
  screenBloom: { particles: 0, segments: 0 },
  nativeVignette: { particles: 0, segments: 0 },
  cinematicFreeze: { particles: 0, segments: 0 },
  colorDrain: { particles: 0, segments: 0 },
  movementDash: { particles: 0, segments: 224 },
  movementWeaponTrail: { particles: 0, segments: 160 },
  movementProjectileTrail: { particles: 32, segments: 96 },
  movementFootsteps: { particles: 24, segments: 128 },
  movementRunning: { particles: 28, segments: 80 },
  movementFalling: { particles: 36, segments: 96 },
  movementFlying: { particles: 40, segments: 160 },
  movementElytraTrail: { particles: 32, segments: 192 },
  movementEnderPearlTrail: { particles: 36, segments: 160 },
  movementSwimmingTrail: { particles: 38, segments: 160 }
};

export const BUILTIN_VFX_PRESET_LOCALIZATION: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(
      BUILTIN_EFFECTS.map((definition) => [
        localizationKey(definition.type),
        definition.name
      ])
    )
  );

function localizationKey(type: EffectType): string {
  return `vfx.presets.${type}.name`;
}

function createMetadata(definition: EffectDefinition): BuiltinVfxPresetMetadata {
  const nativeBudget = NATIVE_FINAL_BUDGETS[definition.type];
  const measured = nativeBudget ?? measureLegacyVfxEffectWork(
    definition.type,
    definition.defaultParameters.count ?? 0
  );
  const capabilities = CAPABILITIES_BY_EFFECT[definition.type];
  const native = BUILTIN_RECIPE_ID_SET.has(definition.type);
  return {
    version: BUILTIN_VFX_PRESET_METADATA_VERSION,
    id: definition.type,
    effectType: definition.type,
    definitionId: definition.type,
    ...(native ? { recipeId: definition.type } : {}),
    category: CATEGORY_BY_EFFECT[definition.type],
    tags: [...definition.tags],
    localizationKey: localizationKey(definition.type),
    thumbnail: {
      kind: "generated",
      cacheKey: `vfx-preset:${definition.type}:v${BUILTIN_VFX_PRESET_METADATA_VERSION}`,
      state: "pending"
    },
    previewQuality: "medium",
    exportQuality: "final",
    compatibility: {
      maturity:
        native || definition.type === "colorGradeKeyframe"
          ? "experimental"
          : "compatibility",
      runtime: native ? "native-primitives" : "compatibility-map",
      minProjectSchema: CURRENT_PROJECT_SCHEMA_VERSION,
      maxProjectSchema: CURRENT_PROJECT_SCHEMA_VERSION,
      capabilities: {
        editable: true,
        preview: capabilities.preview,
        export: capabilities.export
      },
      limitations: [...capabilities.limitations]
    },
    frameBudget: {
      effects: 1,
      particles: measured.particles,
      segments: measured.segments,
      stackWork: 1 + measured.particles + measured.segments
    }
  };
}

function freezePreset(preset: BuiltinVfxPreset): BuiltinVfxPreset {
  return Object.freeze({
    ...preset,
    metadata: Object.freeze({
      ...preset.metadata,
      tags: Object.freeze([...preset.metadata.tags]),
      thumbnail: Object.freeze({ ...preset.metadata.thumbnail }),
      compatibility: Object.freeze({
        ...preset.metadata.compatibility,
        capabilities: Object.freeze({
          ...preset.metadata.compatibility.capabilities
        }),
        limitations: Object.freeze([
          ...preset.metadata.compatibility.limitations
        ])
      }),
      frameBudget: Object.freeze({ ...preset.metadata.frameBudget })
    })
  });
}

export class BuiltinVfxPresetCatalog {
  private readonly presets: readonly BuiltinVfxPreset[];
  private readonly byId: ReadonlyMap<string, BuiltinVfxPreset>;

  constructor(presets: readonly BuiltinVfxPreset[]) {
    const validation = validateBuiltinVfxPresetCatalog(presets, {
      localization: BUILTIN_VFX_PRESET_LOCALIZATION,
      recipeIds: BUILTIN_RECIPE_ID_SET
    });
    if (!validation.ok) {
      throw new RangeError(
        `Invalid built-in VFX preset catalog: ${validation.errors
          .map((error) => `${error.path}: ${error.message}`)
          .join(" ")}`
      );
    }
    const definitionRegistry = new VfxRegistry(
      presets.map((preset) => preset.definition)
    );
    this.presets = Object.freeze(
      presets.map((preset) =>
        freezePreset({
          ...preset,
          definition:
            definitionRegistry.get(preset.metadata.definitionId) ??
            preset.definition
        })
      )
    );
    this.byId = new Map(this.presets.map((preset) => [preset.metadata.id, preset]));
  }

  list(options: { includeExperimental?: boolean } = {}): readonly BuiltinVfxPreset[] {
    return options.includeExperimental === false
      ? this.presets.filter(
          (preset) => preset.metadata.compatibility.maturity !== "experimental"
        )
      : this.presets;
  }

  get(id: string): BuiltinVfxPreset | null {
    return this.byId.get(id) ?? null;
  }

  countStable(): number {
    return this.presets.filter(
      (preset) => preset.metadata.compatibility.maturity === "stable"
    ).length;
  }
}

function createCompatibilityPresets(): BuiltinVfxPreset[] {
  const registry = createLegacyVfxRegistry();
  return BUILTIN_EFFECTS.map((definition) => {
    const nativeDefinition = registry.get(definition.type);
    if (!nativeDefinition) {
      throw new RangeError(`Missing native VFX definition: ${definition.type}`);
    }
    return {
      metadata: createMetadata(definition),
      definition: nativeDefinition,
      localizedName: definition.name
    };
  });
}

export const builtinVfxPresetCatalog = new BuiltinVfxPresetCatalog(
  createCompatibilityPresets()
);
