import type { ValidationIssue } from "../core/serialization/ValidationResult";
import type { MineMotionProject } from "../project/ProjectFile";
import { sanitizeTimelineTracks } from "../project/TimelineTrackSanitizer";
import {
  adaptLegacyEffectDefinition,
  adaptLegacyEffectInstance
} from "../vfx/compat/LegacyEffectAdapter";
import { validateVfxInstance } from "../vfx/core/VfxValidator";
import { validateSynchronizedLegacyEffectNativeVfx } from "../vfx/serialization/VfxProjectMigration";
import { effectRegistry } from "./EffectRegistry";
import {
  effectTimelineIssue,
  isEffectTimelineIdentifier,
  isEffectTimelineParameterRecord,
  isEffectTimelineRecord,
  isEffectTimelineVector3
} from "./EffectTimelineInputValidation";
import {
  MAX_LEGACY_EFFECT_PARTICLE_COUNT,
  type EffectInstance,
  type EffectParameters,
  type EffectType
} from "./EffectTypes";

const EFFECT_INSTANCE_KEYS = new Set([
  "id",
  "type",
  "name",
  "startFrame",
  "durationFrames",
  "position",
  "targetObjectId",
  "parameters",
  "enabled",
  "nativeVfx"
]);

function validateTiming(
  startFrame: unknown,
  durationFrames: unknown,
  path: string
): ValidationIssue | null {
  if (!Number.isSafeInteger(startFrame) || (startFrame as number) < 0) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_START_FRAME_INVALID",
      "Effect start frame must be a non-negative safe integer.",
      `${path}.startFrame`
    );
  }
  if (!Number.isSafeInteger(durationFrames) || (durationFrames as number) < 1) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_DURATION_INVALID",
      "Effect duration must be a positive safe integer.",
      `${path}.durationFrames`
    );
  }
  if (!Number.isSafeInteger((startFrame as number) + (durationFrames as number))) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_FRAME_RANGE_INVALID",
      "The inclusive effect end frame must be a safe integer.",
      `${path}.durationFrames`
    );
  }
  return null;
}

export function validateEffectTimelineTiming(
  project: MineMotionProject,
  startFrame: unknown,
  durationFrames: unknown,
  path: string
): ValidationIssue | null {
  const timingError = validateTiming(startFrame, durationFrames, path);
  if (timingError) return timingError;
  if (
    (startFrame as number) + (durationFrames as number) >
    project.animation.durationFrames
  ) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_FRAME_OUT_OF_RANGE",
      "Effect timing must remain inside the project timeline.",
      `${path}.durationFrames`
    );
  }
  return null;
}

function validateParticleCountBudget(count: unknown): ValidationIssue | null {
  if (
    count !== undefined &&
    (!Number.isSafeInteger(count) ||
      (count as number) < 0 ||
      (count as number) > MAX_LEGACY_EFFECT_PARTICLE_COUNT)
  ) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_PARAMETER_INVALID",
      `Particle count must be an integer between 0 and ${MAX_LEGACY_EFFECT_PARTICLE_COUNT}.`,
      "parameters.count"
    );
  }
  return null;
}

function validateKnownParameters(effect: EffectInstance): ValidationIssue | null {
  const countError = validateParticleCountBudget(effect.parameters.count);
  if (countError) return countError;

  try {
    const definition = effectRegistry.get(effect.type);
    if (!definition) {
      return effectTimelineIssue(
        "EFFECT_TIMELINE_EFFECT_TYPE_INVALID",
        "Effect type is not registered.",
        "type"
      );
    }
    const validation = validateVfxInstance(
      adaptLegacyEffectInstance(effect),
      adaptLegacyEffectDefinition(definition)
    );
    if (!validation.ok) {
      const parameterError = validation.errors.find((error) =>
        error.path?.startsWith("parameters.")
      );
      if (parameterError) {
        return effectTimelineIssue(
          "EFFECT_TIMELINE_PARAMETER_INVALID",
          parameterError.message,
          parameterError.path ?? "parameters"
        );
      }
    }
  } catch (error) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_PARAMETER_INVALID",
      error instanceof Error ? error.message : "Effect parameters are invalid.",
      "parameters"
    );
  }
  return null;
}

export function validateEffectTimelineKnownParameterPatch(
  effect: EffectInstance,
  parameters: EffectParameters
): ValidationIssue | null {
  const countError = validateParticleCountBudget(parameters.count);
  if (countError) return countError;

  try {
    const definition = effectRegistry.get(effect.type);
    if (!definition) {
      return effectTimelineIssue(
        "EFFECT_TIMELINE_EFFECT_TYPE_INVALID",
        "Effect type is not registered.",
        "type"
      );
    }
    const vfxDefinition = adaptLegacyEffectDefinition(definition);
    const schemaById = new Map(
      vfxDefinition.parameterSchema.map((parameter) => [parameter.id, parameter])
    );
    for (const [parameterId, value] of Object.entries(parameters)) {
      if (!schemaById.has(parameterId)) {
        if (
          parameterId === "count" &&
          Object.hasOwn(effect.parameters, parameterId)
        ) {
          continue;
        }
        return effectTimelineIssue(
          "EFFECT_TIMELINE_PARAMETER_UNKNOWN",
          `Parameter ${parameterId} is not supported by ${effect.type}.`,
          `parameters.${parameterId}`
        );
      }
      const validation = validateVfxInstance(
        adaptLegacyEffectInstance({
          ...effect,
          parameters: { [parameterId]: value } as EffectParameters
        }),
        vfxDefinition
      );
      if (!validation.ok) {
        const parameterError = validation.errors.find((error) =>
          error.path?.startsWith(`parameters.${parameterId}`)
        );
        if (parameterError) {
          return effectTimelineIssue(
            "EFFECT_TIMELINE_PARAMETER_INVALID",
            parameterError.message,
            parameterError.path ?? `parameters.${parameterId}`
          );
        }
      }
    }
  } catch (error) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_PARAMETER_INVALID",
      error instanceof Error ? error.message : "Effect parameters are invalid.",
      "parameters"
    );
  }
  return null;
}

export function validateEffectTimelineEffect(
  value: unknown,
  path: string,
  enforceKnownParameterBounds = true
): ValidationIssue | null {
  if (!isEffectTimelineRecord(value)) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_EFFECT_INVALID",
      "Effect data must be an object.",
      path
    );
  }
  const invalidKey = Object.keys(value).find(
    (key) => !EFFECT_INSTANCE_KEYS.has(key)
  );
  if (invalidKey) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_EFFECT_INVALID",
      `Effect field ${invalidKey} is outside the serialized effect contract.`,
      `${path}.${invalidKey}`
    );
  }
  if (!isEffectTimelineIdentifier(value.id)) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_ID_INVALID",
      "Effect ID is invalid.",
      `${path}.id`
    );
  }
  if (typeof value.type !== "string" || !effectRegistry.get(value.type as EffectType)) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_EFFECT_TYPE_INVALID",
      "Effect type is not registered.",
      `${path}.type`
    );
  }
  if (typeof value.name !== "string" || value.name.trim() === "") {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_NAME_INVALID",
      "Effect name is required.",
      `${path}.name`
    );
  }
  const timingError = validateTiming(value.startFrame, value.durationFrames, path);
  if (timingError) return timingError;
  if (!isEffectTimelineVector3(value.position)) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_POSITION_INVALID",
      "Effect position must contain three finite numbers.",
      `${path}.position`
    );
  }
  if (typeof value.targetObjectId !== "string") {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_TARGET_INVALID",
      "Effect target ID must be a string.",
      `${path}.targetObjectId`
    );
  }
  if (!isEffectTimelineParameterRecord(value.parameters)) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_PARAMETERS_INVALID",
      "Effect parameters must contain finite primitive values.",
      `${path}.parameters`
    );
  }
  if (typeof value.enabled !== "boolean") {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_ENABLED_INVALID",
      "Effect enabled state must be a boolean.",
      `${path}.enabled`
    );
  }
  if (value.nativeVfx !== undefined) {
    try {
      const nativeError = validateSynchronizedLegacyEffectNativeVfx(
        value as unknown as EffectInstance,
        value.nativeVfx as NonNullable<EffectInstance["nativeVfx"]>
      );
      if (nativeError) throw new Error(nativeError);
    } catch (error) {
      return effectTimelineIssue(
        "EFFECT_TIMELINE_NATIVE_VFX_INVALID",
        error instanceof Error ? error.message : "Native VFX data is invalid.",
        `${path}.nativeVfx`
      );
    }
  }
  if (enforceKnownParameterBounds) {
    const parameterError = validateKnownParameters(
      value as unknown as EffectInstance
    );
    if (parameterError) {
      return { ...parameterError, path: `${path}.${parameterError.path}` };
    }
  }
  return null;
}

export function validateEffectTimelineProject(
  project: MineMotionProject
): ValidationIssue | null {
  if (
    !isEffectTimelineRecord(project) ||
    !isEffectTimelineRecord(project.effects) ||
    !Array.isArray(project.effects.instances)
  ) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_PROJECT_INVALID",
      "Project effects.instances must be an array.",
      "effects.instances"
    );
  }
  if (
    !isEffectTimelineRecord(project.animation) ||
    !Array.isArray(project.animation.timelineTracks) ||
    !Number.isSafeInteger(project.animation.durationFrames) ||
    project.animation.durationFrames < 1
  ) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_PROJECT_INVALID",
      "Project animation timeline data is invalid.",
      "animation"
    );
  }
  try {
    sanitizeTimelineTracks(project.animation.timelineTracks);
  } catch (error) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_PROJECT_INVALID",
      error instanceof Error ? error.message : "Project timeline tracks are invalid.",
      "animation.timelineTracks"
    );
  }
  const seen = new Set<string>();
  for (let index = 0; index < project.effects.instances.length; index += 1) {
    const effect = project.effects.instances[index];
    const effectError = validateEffectTimelineEffect(
      effect,
      `effects.instances[${index}]`,
      false
    );
    if (effectError) return effectError;
    if (seen.has(effect.id)) {
      return effectTimelineIssue(
        "EFFECT_TIMELINE_ID_DUPLICATE",
        `Effect ID ${effect.id} is duplicated.`,
        `effects.instances[${index}].id`
      );
    }
    seen.add(effect.id);
  }
  return null;
}
