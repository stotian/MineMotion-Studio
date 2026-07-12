import { createDeterministicId } from "../../core/ids/Id";
import {
  invalidResult,
  validResult,
  type ValidationIssue,
  type ValidationResult
} from "../../core/serialization/ValidationResult";
import { effectRegistry } from "../../effects/EffectRegistry";
import type {
  EffectDefinition,
  EffectInstance,
  EffectParameters,
  EffectType
} from "../../effects/EffectTypes";
import { MAX_LEGACY_EFFECT_PARTICLE_COUNT } from "../../effects/EffectTypes";
import {
  VFX_DEFINITION_VERSION,
  type VfxBlendMode,
  type VfxDefinition,
  type VfxRenderLayer
} from "../core/VfxDefinition";
import {
  VFX_INSTANCE_SERIALIZATION_VERSION,
  type VfxInstance
} from "../core/VfxInstance";
import {
  isVfxParameterValue,
  type VfxParameterValue
} from "../core/VfxParameter";
import type { VfxParameterDefinition } from "../core/VfxParameterSchema";
import { VfxRegistry } from "../core/VfxRegistry";
import { validateVfxInstance } from "../core/VfxValidator";

const LEGACY_COMPATIBILITY_SEED_NAMESPACE = "legacy-effect-schema-9";
const LEGACY_PREVIEW_QUALITY = "medium" as const;
const LEGACY_EXPORT_QUALITY = "final" as const;

type LegacyParameterKey = keyof EffectParameters;
type LegacyParameterFactory = (
  defaultValue: VfxParameterValue
) => VfxParameterDefinition;

function parameterBase(id: string, displayName: string) {
  return {
    id,
    displayName,
    category: "Legacy Effect",
    animatable: true
  } as const;
}

function requireNumber(id: string, value: VfxParameterValue): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`Legacy effect parameter ${id} must be a finite number.`);
  }
  return value;
}

function requireString(id: string, value: VfxParameterValue): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new RangeError(`Legacy effect parameter ${id} must be a non-empty string.`);
  }
  return value;
}

function requireBoolean(id: string, value: VfxParameterValue): boolean {
  if (typeof value !== "boolean") {
    throw new RangeError(`Legacy effect parameter ${id} must be a boolean.`);
  }
  return value;
}

const LEGACY_PARAMETER_FACTORIES: Record<
  LegacyParameterKey,
  LegacyParameterFactory
> = {
  color: (value) => ({
    ...parameterBase("color", "Color"),
    kind: "color",
    defaultValue: requireString("color", value)
  }),
  secondaryColor: (value) => ({
    ...parameterBase("secondaryColor", "Secondary Color"),
    kind: "color",
    defaultValue: requireString("secondaryColor", value)
  }),
  intensity: (value) => ({
    ...parameterBase("intensity", "Intensity"),
    kind: "number",
    defaultValue: requireNumber("intensity", value),
    min: 0,
    max: 3,
    step: 0.05
  }),
  alpha: (value) => ({
    ...parameterBase("alpha", "Alpha"),
    kind: "number",
    defaultValue: requireNumber("alpha", value),
    min: 0,
    max: 1,
    step: 0.01
  }),
  radius: (value) => ({
    ...parameterBase("radius", "Radius"),
    kind: "number",
    defaultValue: requireNumber("radius", value),
    min: 0,
    max: 100,
    step: 0.1,
    unit: "blocks"
  }),
  size: (value) => ({
    ...parameterBase("size", "Size"),
    kind: "number",
    defaultValue: requireNumber("size", value),
    min: 0,
    max: 100,
    step: 0.01,
    unit: "blocks"
  }),
  count: (value) => ({
    ...parameterBase("count", "Count"),
    kind: "integer",
    defaultValue: requireNumber("count", value),
    min: 0,
    max: MAX_LEGACY_EFFECT_PARTICLE_COUNT,
    step: 1
  }),
  frequency: (value) => ({
    ...parameterBase("frequency", "Frequency"),
    kind: "number",
    defaultValue: requireNumber("frequency", value),
    min: 0,
    max: 240,
    step: 1
  }),
  strength: (value) => ({
    ...parameterBase("strength", "Strength"),
    kind: "number",
    defaultValue: requireNumber("strength", value),
    min: 0,
    max: 100,
    step: 0.05
  }),
  decay: (value) => ({
    ...parameterBase("decay", "Decay"),
    kind: "number",
    defaultValue: requireNumber("decay", value),
    min: 0,
    max: 1,
    step: 0.01
  }),
  direction: (value) => ({
    ...parameterBase("direction", "Direction"),
    kind: "enum",
    defaultValue: requireString("direction", value),
    options: ["forward", "backward", "left", "right", "radial"]
  }),
  barStyle: (value) => ({
    ...parameterBase("barStyle", "Bar Style"),
    kind: "enum",
    defaultValue: requireString("barStyle", value),
    options: ["16:9", "2.35:1"]
  }),
  contrast: (value) => ({
    ...parameterBase("contrast", "Contrast"),
    kind: "number",
    defaultValue: requireNumber("contrast", value),
    min: 0,
    max: 4,
    step: 0.05
  }),
  saturation: (value) => ({
    ...parameterBase("saturation", "Saturation"),
    kind: "number",
    defaultValue: requireNumber("saturation", value),
    min: 0,
    max: 4,
    step: 0.05
  }),
  speed: (value) => ({
    ...parameterBase("speed", "Speed"),
    kind: "number",
    defaultValue: requireNumber("speed", value),
    min: 0,
    max: 100,
    step: 0.05
  }),
  flash: (value) => ({
    ...parameterBase("flash", "Flash"),
    kind: "boolean",
    defaultValue: requireBoolean("flash", value)
  })
};

function isLegacyParameterKey(key: string): key is LegacyParameterKey {
  return Object.prototype.hasOwnProperty.call(LEGACY_PARAMETER_FACTORIES, key);
}

function legacyBlendMode(definition: EffectDefinition): VfxBlendMode {
  if (definition.type === "impactFrame") return "difference";
  if (definition.type === "lightningStrike" || definition.type === "glowBurst") {
    return "additive";
  }
  if (definition.space === "screen") return "screen";
  return "normal";
}

function legacyRenderLayer(definition: EffectDefinition): VfxRenderLayer {
  if (definition.type === "colorGradeKeyframe") return "post";
  if (definition.space === "world") return "world";
  if (definition.space === "camera") return "camera";
  return "overlay";
}

function cloneLegacyParameters(
  parameters: EffectParameters
): Record<string, VfxParameterValue> {
  const cloned: Record<string, VfxParameterValue> = {};
  for (const [key, value] of Object.entries(parameters)) {
    if (!isVfxParameterValue(value)) {
      throw new RangeError(
        `Legacy effect parameter ${key} cannot be represented by the Phase 15.1 VFX model.`
      );
    }
    cloned[key] = value;
  }
  return cloned;
}

export function createLegacyVfxSeed(
  instanceId: string,
  definitionId: string
): string {
  return createDeterministicId(
    "vfx_seed",
    `${LEGACY_COMPATIBILITY_SEED_NAMESPACE}:${definitionId}:${instanceId}`
  );
}

export function adaptLegacyEffectDefinition(
  definition: EffectDefinition
): VfxDefinition {
  const parameterSchema = Object.entries(definition.defaultParameters).map(
    ([key, value]) => {
      if (!isLegacyParameterKey(key) || !isVfxParameterValue(value)) {
        throw new RangeError(
          `Legacy effect definition ${definition.type} has an unsupported default parameter: ${key}`
        );
      }
      return LEGACY_PARAMETER_FACTORIES[key](value);
    }
  );

  return {
    version: VFX_DEFINITION_VERSION,
    id: definition.type,
    displayName: definition.name,
    description: definition.description,
    space: definition.space,
    defaultDurationFrames: definition.defaultDurationFrames,
    defaultBlendMode: legacyBlendMode(definition),
    defaultRenderLayer: legacyRenderLayer(definition),
    parameterSchema,
    tags: [...definition.tags]
  };
}

export function createLegacyVfxRegistry(
  definitions: readonly EffectDefinition[] = effectRegistry.list()
): VfxRegistry {
  return new VfxRegistry(definitions.map(adaptLegacyEffectDefinition));
}

function getLegacyVfxDefinition(definitionId: string): VfxDefinition | null {
  const definition = effectRegistry.get(definitionId as EffectType);
  return definition ? adaptLegacyEffectDefinition(definition) : null;
}

export function adaptLegacyEffectInstance(effect: EffectInstance): VfxInstance {
  const definition = getLegacyVfxDefinition(effect.type);
  if (!definition) {
    throw new RangeError(`Legacy effect definition was not found: ${effect.type}`);
  }

  return {
    serializationVersion: VFX_INSTANCE_SERIALIZATION_VERSION,
    id: effect.id,
    definitionId: effect.type,
    displayName: effect.name,
    startFrame: effect.startFrame,
    durationFrames: effect.durationFrames,
    enabled: effect.enabled,
    space: definition.space,
    transform: {
      position: [...effect.position],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    },
    target: effect.targetObjectId
      ? { entityId: effect.targetObjectId }
      : null,
    seed: createLegacyVfxSeed(effect.id, effect.type),
    parameters: cloneLegacyParameters(effect.parameters),
    blendMode: definition.defaultBlendMode,
    renderLayer: definition.defaultRenderLayer,
    previewQuality: LEGACY_PREVIEW_QUALITY,
    exportQuality: LEGACY_EXPORT_QUALITY
  };
}

function conversionIssue(
  code: string,
  message: string,
  path: string
): ValidationIssue {
  return { code, message, path, severity: "error" };
}

function isDefaultVector(
  value: readonly number[],
  expected: readonly number[]
): boolean {
  return (
    value.length === expected.length &&
    value.every((item, index) => item === expected[index])
  );
}

function isLegacyEffectType(value: string): value is EffectType {
  return effectRegistry.get(value as EffectType) !== null;
}

export function adaptVfxInstanceToLegacyEffect(
  instance: VfxInstance
): ValidationResult<EffectInstance> {
  if (!isLegacyEffectType(instance.definitionId)) {
    return invalidResult([
      conversionIssue(
        "VFX_LEGACY_DEFINITION_UNSUPPORTED",
        `VFX definition cannot be represented by schema 9: ${instance.definitionId}`,
        "definitionId"
      )
    ]);
  }

  const legacyType = instance.definitionId;
  const definition = getLegacyVfxDefinition(instance.definitionId);
  const validation = validateVfxInstance(instance, definition);
  const warnings = [...validation.warnings];

  if (!validation.ok) {
    return invalidResult([...validation.errors], warnings);
  }

  const errors: ValidationIssue[] = [];
  if (!isDefaultVector(instance.transform.rotation, [0, 0, 0])) {
    errors.push(
      conversionIssue(
        "VFX_LEGACY_ROTATION_UNSUPPORTED",
        "Schema 9 effects cannot store VFX rotation.",
        "transform.rotation"
      )
    );
  }
  if (!isDefaultVector(instance.transform.scale, [1, 1, 1])) {
    errors.push(
      conversionIssue(
        "VFX_LEGACY_SCALE_UNSUPPORTED",
        "Schema 9 effects cannot store VFX scale.",
        "transform.scale"
      )
    );
  }
  if (instance.target?.boneId) {
    errors.push(
      conversionIssue(
        "VFX_LEGACY_BONE_TARGET_UNSUPPORTED",
        "Schema 9 effects cannot store a target bone.",
        "target.boneId"
      )
    );
  }
  if (definition && instance.blendMode !== definition.defaultBlendMode) {
    errors.push(
      conversionIssue(
        "VFX_LEGACY_BLEND_MODE_UNSUPPORTED",
        "Schema 9 effects cannot store a custom blend mode.",
        "blendMode"
      )
    );
  }
  if (definition && instance.renderLayer !== definition.defaultRenderLayer) {
    errors.push(
      conversionIssue(
        "VFX_LEGACY_RENDER_LAYER_UNSUPPORTED",
        "Schema 9 effects cannot store a custom render layer.",
        "renderLayer"
      )
    );
  }
  if (
    instance.previewQuality !== LEGACY_PREVIEW_QUALITY ||
    instance.exportQuality !== LEGACY_EXPORT_QUALITY
  ) {
    errors.push(
      conversionIssue(
        "VFX_LEGACY_QUALITY_UNSUPPORTED",
        "Schema 9 effects cannot store per-instance VFX quality.",
        "previewQuality"
      )
    );
  }
  if (
    instance.seed !==
    createLegacyVfxSeed(instance.id, instance.definitionId)
  ) {
    errors.push(
      conversionIssue(
        "VFX_LEGACY_SEED_UNSUPPORTED",
        "Schema 9 effects cannot store a custom VFX seed.",
        "seed"
      )
    );
  }

  if (errors.length > 0) {
    return invalidResult(errors, warnings);
  }

  const parameters: Record<string, VfxParameterValue> = {};
  for (const [key, value] of Object.entries(instance.parameters)) {
    if (!isVfxParameterValue(value)) {
      return invalidResult(
        [
          conversionIssue(
            "VFX_LEGACY_PARAMETER_UNSUPPORTED",
            `Schema 9 cannot store parameter ${key}.`,
            `parameters.${key}`
          )
        ],
        warnings
      );
    }
    parameters[key] = value;
  }

  return validResult(
    {
      id: instance.id,
      type: legacyType,
      name: instance.displayName,
      startFrame: instance.startFrame,
      durationFrames: instance.durationFrames,
      position: [...instance.transform.position],
      targetObjectId: instance.target?.entityId ?? "",
      parameters: parameters as EffectParameters,
      enabled: instance.enabled
    },
    warnings
  );
}
