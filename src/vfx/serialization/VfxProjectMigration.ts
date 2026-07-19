import { sanitizeEffects } from "../../effects/EffectSerializer";
import type { EffectInstance } from "../../effects/EffectTypes";
import {
  adaptLegacyEffectInstance,
  adaptVfxInstanceToLegacyEffect,
  createProjectVfxRegistry
} from "../compat/LegacyEffectAdapter";
import type { VfxInstance } from "../core/VfxInstance";
import type { VfxParameterValue } from "../core/VfxParameter";

export interface SerializedEffectInstanceV10 extends EffectInstance {
  nativeVfx: VfxInstance;
}

const legacyVfxRegistry = createProjectVfxRegistry();

function cloneLegacyEffect(effect: EffectInstance): EffectInstance {
  const { nativeVfx: _nativeVfx, ...legacy } = effect;
  const sanitized = sanitizeEffects([legacy])[0];
  if (!sanitized) throw new Error("Effect could not be sanitized for persistence.");
  return sanitized;
}

function cloneValidatedLegacyEffect(effect: EffectInstance): EffectInstance {
  const { nativeVfx: _nativeVfx, ...legacy } = effect;
  return {
    ...legacy,
    position: [...legacy.position],
    parameters: Object.fromEntries(Object.entries(legacy.parameters))
  };
}

function validationMessage(instance: VfxInstance): string | null {
  const validation = legacyVfxRegistry.validateInstance(instance);
  return validation.ok
    ? null
    : validation.errors
        .map((error) => `${error.path}: ${error.message}`)
        .join(" ");
}

function validateAndRepairMigratedParameters(instance: VfxInstance): {
  instance: VfxInstance;
  error: string | null;
} {
  const definition = legacyVfxRegistry.get(instance.definitionId);
  if (!definition) {
    return {
      instance,
      error: `definitionId: VFX definition was not found: ${instance.definitionId}`
    };
  }
  const validation = legacyVfxRegistry.validateInstance(instance);
  if (validation.ok) return { instance, error: null };

  const invalidParameterIds = new Set(
    validation.errors.flatMap((error) => {
      const match = /^parameters\.([^.]+)$/.exec(error.path ?? "");
      return match?.[1] ? [match[1]] : [];
    })
  );
  if (invalidParameterIds.size === 0) {
    return {
      instance,
      error: validation.errors
        .map((error) => `${error.path}: ${error.message}`)
        .join(" ")
    };
  }

  const defaults = new Map(
    definition.parameterSchema.map((parameter) => [
      parameter.id,
      parameter.defaultValue
    ])
  );
  const entries: Array<[string, VfxParameterValue]> = [];
  for (const [id, value] of Object.entries(instance.parameters)) {
    entries.push([
      id,
      invalidParameterIds.has(id) && defaults.has(id)
        ? (defaults.get(id) as VfxParameterValue)
        : value
    ]);
  }
  const repaired = {
    ...instance,
    parameters: Object.fromEntries(entries)
  };
  return { instance: repaired, error: validationMessage(repaired) };
}

function cloneNativeVfx(value: VfxInstance): VfxInstance {
  try {
    return structuredClone(value);
  } catch {
    throw new Error("Schema 10 native VFX data must be structured-cloneable.");
  }
}

function samePlainData(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => samePlainData(value, right[index]))
    );
  }
  if (
    typeof left !== "object" ||
    left === null ||
    typeof right !== "object" ||
    right === null
  ) {
    return false;
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] &&
        samePlainData(leftRecord[key], rightRecord[key])
    )
  );
}

function sameVector3(
  left: readonly number[] | undefined,
  right: readonly number[]
): boolean {
  return Boolean(
    left &&
      left.length === 3 &&
      left.every((value, index) => Object.is(value, right[index]))
  );
}

/**
 * Validates an already persisted schema 10 record without cloning or rebuilding
 * it. This is the hot editor-command path; serializers still perform their
 * independent canonical reconstruction and lossless equality checks.
 */
export function validateSynchronizedLegacyEffectNativeVfx(
  effect: EffectInstance,
  nativeVfx: VfxInstance
): string | null {
  const nativeValidation = validateAndRepairMigratedParameters(nativeVfx);
  if (nativeValidation.error) return nativeValidation.error;
  const projected = adaptLegacyEffectInstance(effect);
  const isCustomRecipe = nativeVfx.customRecipe !== undefined;
  let projectedParameters = projected.parameters;
  let nativeParameters = nativeVfx.parameters;
  if (!samePlainData(nativeParameters, projectedParameters)) {
    const projectedValidation = validateAndRepairMigratedParameters(projected);
    if (projectedValidation.error) return projectedValidation.error;
    projectedParameters = projectedValidation.instance.parameters;
    nativeParameters = nativeValidation.instance.parameters;
  }
  if (
    nativeVfx.serializationVersion !== projected.serializationVersion ||
    nativeVfx.id !== projected.id ||
    nativeVfx.definitionId !== projected.definitionId ||
    nativeVfx.displayName !== projected.displayName ||
    nativeVfx.startFrame !== projected.startFrame ||
    nativeVfx.durationFrames !== projected.durationFrames ||
    nativeVfx.enabled !== projected.enabled ||
    (!isCustomRecipe && nativeVfx.space !== projected.space) ||
    !sameVector3(nativeVfx.transform?.position, projected.transform.position) ||
    !samePlainData(nativeParameters, projectedParameters)
  ) {
    return "Legacy and native VFX shared fields are inconsistent.";
  }
  if (projected.target === null) {
    if (nativeVfx.target !== null) {
      return "Legacy and native VFX targets are inconsistent.";
    }
  } else if (nativeVfx.target?.entityId !== projected.target.entityId) {
    return "Legacy and native VFX targets are inconsistent.";
  }
  return null;
}

function synchronizeLegacyEffectNativeVfxInternal(
  effect: EffectInstance,
  existing: VfxInstance | undefined,
  trustedValidatedLegacy: boolean
): SerializedEffectInstanceV10 {
  const legacy = trustedValidatedLegacy
    ? cloneValidatedLegacyEffect(effect)
    : cloneLegacyEffect(effect);
  const projected = adaptLegacyEffectInstance(legacy);
  let nativeVfx = projected;

  if (existing !== undefined) {
    const cloned = cloneNativeVfx(existing);
    const existingError = validationMessage(cloned);
    if (existingError) {
      throw new Error(`Schema 10 native VFX data is invalid. ${existingError}`);
    }
    const isCustomRecipe = cloned.customRecipe !== undefined;
    nativeVfx = {
      ...cloned,
      serializationVersion: projected.serializationVersion,
      id: projected.id,
      definitionId: projected.definitionId,
      displayName: projected.displayName,
      startFrame: projected.startFrame,
      durationFrames: projected.durationFrames,
      enabled: projected.enabled,
      space: isCustomRecipe ? cloned.space : projected.space,
      transform: {
        position: [...projected.transform.position],
        rotation: [...cloned.transform.rotation],
        scale: [...cloned.transform.scale]
      },
      target: projected.target
        ? {
            entityId: projected.target.entityId,
            ...(cloned.target?.boneId === undefined
              ? {}
              : { boneId: cloned.target.boneId })
          }
        : null,
      parameters: Object.fromEntries(Object.entries(projected.parameters)),
      parameterKeyframes: cloned.parameterKeyframes.map((keyframe) => ({
        ...keyframe
      }))
    };
  }

  const synchronized = validateAndRepairMigratedParameters(nativeVfx);
  nativeVfx = synchronized.instance;
  if (synchronized.error) {
    throw new Error(
      `Effect ${legacy.id} cannot be represented by schema 10 native VFX. ${synchronized.error}`
    );
  }

  return { ...legacy, nativeVfx };
}

export function synchronizeLegacyEffectNativeVfx(
  effect: EffectInstance,
  existing?: VfxInstance
): SerializedEffectInstanceV10 {
  return synchronizeLegacyEffectNativeVfxInternal(effect, existing, false);
}

export function synchronizeValidatedLegacyEffectNativeVfx(
  effect: EffectInstance,
  existing?: VfxInstance
): SerializedEffectInstanceV10 {
  return synchronizeLegacyEffectNativeVfxInternal(effect, existing, true);
}

export function migrateLegacyEffectsToSchema10(
  value: unknown
): SerializedEffectInstanceV10[] {
  return sanitizeEffects(value).map((effect) =>
    synchronizeLegacyEffectNativeVfx(effect)
  );
}

export function sanitizeSchema10Effects(
  value: unknown
): SerializedEffectInstanceV10[] {
  if (!Array.isArray(value)) {
    throw new Error("Project effects.instances must be an array.");
  }
  const legacyEffects = sanitizeEffects(value);
  return legacyEffects.map((effect, index) => {
    const raw = value[index];
    if (
      typeof raw !== "object" ||
      raw === null ||
      !Object.hasOwn(raw, "nativeVfx")
    ) {
      throw new Error(
        `effects.instances[${index}]: schema 10 nativeVfx data is required.`
      );
    }
    const rawNativeVfx = (raw as { nativeVfx: VfxInstance }).nativeVfx;
    const synchronized = synchronizeLegacyEffectNativeVfx(
      effect,
      rawNativeVfx
    );
    if (!samePlainData(synchronized.nativeVfx, rawNativeVfx)) {
      throw new Error(
        `effects.instances[${index}]: legacy and native VFX shared fields are inconsistent.`
      );
    }
    return synchronized;
  });
}

export function normalizeEffectsForSchema10(
  value: unknown
): SerializedEffectInstanceV10[] {
  if (!Array.isArray(value)) {
    throw new Error("Project effects.instances must be an array.");
  }
  const legacyEffects = sanitizeEffects(value);
  return legacyEffects.map((effect, index) => {
    const raw = value[index];
    const nativeVfx =
      typeof raw === "object" &&
      raw !== null &&
      Object.hasOwn(raw, "nativeVfx")
        ? (raw as { nativeVfx?: VfxInstance }).nativeVfx
        : undefined;
    return synchronizeLegacyEffectNativeVfx(effect, nativeVfx);
  });
}

export function serializeEffectsAsSchema9(
  effects: readonly EffectInstance[]
): EffectInstance[] {
  return effects.map((effect) => {
    const synchronized = synchronizeLegacyEffectNativeVfx(
      effect,
      effect.nativeVfx
    );
    const conversion = adaptVfxInstanceToLegacyEffect(synchronized.nativeVfx);
    if (!conversion.ok) {
      throw new Error(
        `Effect ${effect.id} cannot be exported to schema 9. ${conversion.errors
          .map((error) => error.message)
          .join(" ")}`
      );
    }
    return cloneLegacyEffect(effect);
  });
}
