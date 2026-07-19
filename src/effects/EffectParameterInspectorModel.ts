import {
  invalidResult,
  type ValidationResult
} from "../core/serialization/ValidationResult";
import {
  buildVfxParameterControlModel,
  type VfxParameterControlModel,
  type VfxParameterRuntimeSupport
} from "../vfx/editor/VfxParameterControlModel";
import { adaptLegacyEffectDefinition } from "../vfx/compat/LegacyEffectAdapter";
import { effectRegistry } from "./EffectRegistry";
import type { EffectInstance, EffectParameters, EffectType } from "./EffectTypes";

type RuntimeSupportMap = Partial<
  Record<keyof EffectParameters, VfxParameterRuntimeSupport>
>;

const LIVE_PREVIEW_PARAMETERS: Partial<Record<EffectType, RuntimeSupportMap>> = {
  lightningStrike: { color: "live-preview", alpha: "live-preview", radius: "live-preview" },
  impactFrame: { color: "live-preview", alpha: "live-preview" },
  cameraShake: { strength: "live-preview", frequency: "live-preview" },
  flash: { color: "live-preview", alpha: "live-preview" },
  shockwave: { color: "live-preview", alpha: "live-preview", radius: "live-preview" },
  glowBurst: {
    color: "live-preview",
    alpha: "live-preview",
    count: "live-preview",
    size: "live-preview",
    radius: "live-preview"
  },
  fogPulse: { color: "live-preview", alpha: "live-preview" },
  cinematicBars: { barStyle: "live-preview" },
  explosionFlash: { color: "live-preview", alpha: "live-preview" },
  combatSparks: { color: "live-preview", alpha: "live-preview", count: "live-preview", size: "live-preview", radius: "live-preview", speed: "live-preview", intensity: "live-preview" },
  combatImpact: { color: "live-preview", alpha: "live-preview", radius: "live-preview", intensity: "live-preview" },
  swordSlash: { color: "live-preview", alpha: "live-preview", radius: "live-preview", size: "live-preview", intensity: "live-preview" },
  parryBurst: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", intensity: "live-preview" },
  groundSlam: { color: "live-preview", alpha: "live-preview", count: "live-preview", size: "live-preview", radius: "live-preview", speed: "live-preview", intensity: "live-preview" },
  landingDust: { color: "live-preview", alpha: "live-preview", count: "live-preview", size: "live-preview", radius: "live-preview", speed: "live-preview", intensity: "live-preview" },
  criticalHit: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", count: "live-preview", size: "live-preview", radius: "live-preview", speed: "live-preview", intensity: "live-preview" },
  hitStop: { color: "live-preview", alpha: "live-preview", intensity: "live-preview" },
  electricStrike: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  electricStorm: { color: "live-preview", alpha: "live-preview", radius: "live-preview", intensity: "live-preview" },
  electricBeam: { color: "live-preview", alpha: "live-preview", radius: "live-preview", size: "live-preview", intensity: "live-preview" },
  electricAura: { color: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  electricCharge: { color: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  electricSparks: { color: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  chainLightning: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", intensity: "live-preview" },
  electricWeaponTrail: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", size: "live-preview", intensity: "live-preview" },
  nativeFire: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  smokePlume: { color: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  nativeExplosion: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  emberBurst: { color: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  debrisBurst: { color: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  dustCloud: { color: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  netherFire: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  soulFire: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  magicAura: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  magicBeam: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", size: "live-preview", intensity: "live-preview" },
  magicProjectile: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", size: "live-preview", intensity: "live-preview" },
  magicPortal: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  magicTeleport: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  magicHeal: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  magicCorruption: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  magicPowerUp: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  environmentRain: { color: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  environmentSnow: { color: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  environmentAsh: { color: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  environmentFog: { color: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  environmentDust: { color: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  environmentStorm: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  environmentEnd: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  environmentNether: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  environmentCave: { color: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" },
  environmentFireflies: { color: "live-preview", secondaryColor: "live-preview", alpha: "live-preview", radius: "live-preview", count: "live-preview", size: "live-preview", speed: "live-preview", intensity: "live-preview" }
};

const EXPORT_ONLY_PARAMETERS: Partial<Record<EffectType, RuntimeSupportMap>> = {
  speedLines: { color: "export-only", intensity: "export-only" },
  vignettePulse: { alpha: "export-only" }
};

function supportById(effectType: EffectType): Record<string, VfxParameterRuntimeSupport> {
  return {
    ...(EXPORT_ONLY_PARAMETERS[effectType] ?? {}),
    ...(LIVE_PREVIEW_PARAMETERS[effectType] ?? {})
  };
}

export function createEffectParameterInspectorModel(
  effect: EffectInstance
): ValidationResult<VfxParameterControlModel> {
  try {
    const definition = effectRegistry.get(effect.type);
    if (!definition) {
      return invalidResult([
        {
          code: "VFX_PARAMETER_CONTROL_DEFINITION_NOT_FOUND",
          message: `Effect definition was not found: ${String(effect.type)}.`,
          path: "type",
          severity: "error"
        }
      ]);
    }
    const vfxDefinition = adaptLegacyEffectDefinition(definition);
    return buildVfxParameterControlModel(
      vfxDefinition.parameterSchema,
      effect.parameters,
      { runtimeSupportById: supportById(effect.type) }
    );
  } catch (error) {
    return invalidResult([
      {
        code: "VFX_PARAMETER_CONTROL_MODEL_INVALID",
        message:
          error instanceof Error
            ? error.message
            : "Effect parameter controls could not be generated.",
        path: "parameters",
        severity: "error"
      }
    ]);
  }
}
