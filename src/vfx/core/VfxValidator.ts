import {
  invalidResult,
  validResult,
  type ValidationIssue,
  type ValidationResult
} from "../../core/serialization/ValidationResult";
import {
  VFX_DEFINITION_VERSION,
  type VfxBlendMode,
  type VfxDefinition,
  type VfxRenderLayer,
  type VfxSpace
} from "./VfxDefinition";
import type { VfxQuality } from "./VfxEvaluationContext";
import {
  VFX_CUSTOM_RECIPE_VERSION,
  VFX_INSTANCE_SERIALIZATION_VERSION,
  type VfxInstance,
  type VfxParameterKeyframeInterpolation
} from "./VfxInstance";
import {
  MAX_VFX_PARAMETER_ID_LENGTH,
  isSafeVfxColor,
  isVfxParameterValue
} from "./VfxParameter";
import type { VfxParameterDefinition } from "./VfxParameterSchema";
import { validateVfxPrimitiveDescriptor } from "../primitives/VfxPrimitiveValidator";
import { MAX_VFX_RECIPE_PRIMITIVES } from "../recipes/VfxPresetRecipeTypes";
import { VFX_GLOBAL_FRAME_LIMITS } from "../runtime/VfxFrameBudget";

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/;
const VFX_SPACES = new Set<VfxSpace>(["world", "screen", "camera"]);
const VFX_BLEND_MODES = new Set<VfxBlendMode>([
  "normal",
  "additive",
  "multiply",
  "screen",
  "difference"
]);
const VFX_RENDER_LAYERS = new Set<VfxRenderLayer>([
  "world",
  "camera",
  "overlay",
  "post"
]);
const VFX_QUALITIES = new Set<VfxQuality>([
  "draft",
  "medium",
  "high",
  "final"
]);
const VFX_PARAMETER_KEYFRAME_INTERPOLATIONS =
  new Set<VfxParameterKeyframeInterpolation>([
    "constant",
    "linear",
    "ease-in",
    "ease-out",
    "ease-in-out"
  ]);
const MAX_VFX_PARAMETER_KEYFRAMES = 16_384;
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const CUSTOM_RECIPE_KEYS = new Set(["version", "source", "descriptors"]);
const CUSTOM_RECIPE_SOURCE_KEYS = new Set(["packageId", "packageVersion", "documentId"]);

function issue(
  code: string,
  message: string,
  path: string,
  severity: ValidationIssue["severity"] = "error"
): ValidationIssue {
  return { code, message, path, severity };
}

function isIdentifier(value: unknown): value is string {
  return typeof value === "string" && IDENTIFIER_PATTERN.test(value);
}

function isParameterIdentifier(value: unknown): value is string {
  return (
    isIdentifier(value) && value.length <= MAX_VFX_PARAMETER_ID_LENGTH
  );
}

function isFiniteVector3(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((component) =>
      typeof component === "number" && Number.isFinite(component)
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateCustomRecipe(instance: VfxInstance): ValidationIssue[] {
  const recipe = instance.customRecipe;
  if (instance.definitionId === "customVfx" && recipe === undefined) {
    return [issue("VFX_CUSTOM_RECIPE_REQUIRED", "Custom VFX instances require an embedded compiled recipe.", "customRecipe")];
  }
  if (recipe === undefined) return [];
  const errors: ValidationIssue[] = [];
  if (instance.definitionId !== "customVfx") {
    errors.push(issue("VFX_CUSTOM_RECIPE_DEFINITION_INVALID", "Embedded custom recipes require the customVfx definition.", "definitionId"));
  }
  if (!isRecord(recipe) || recipe.version !== VFX_CUSTOM_RECIPE_VERSION) {
    return [issue("VFX_CUSTOM_RECIPE_VERSION_UNSUPPORTED", "Custom VFX recipe version is unsupported.", "customRecipe.version")];
  }
  const invalidRecipeKey = Object.keys(recipe).find((key) => !CUSTOM_RECIPE_KEYS.has(key));
  if (invalidRecipeKey) errors.push(issue("VFX_CUSTOM_RECIPE_FIELD_INVALID", `Unknown custom VFX recipe field: ${invalidRecipeKey}.`, `customRecipe.${invalidRecipeKey}`));
  if (!isRecord(recipe.source)) {
    errors.push(issue("VFX_CUSTOM_RECIPE_SOURCE_INVALID", "Custom VFX recipe source is invalid.", "customRecipe.source"));
  } else {
    const invalidSourceKey = Object.keys(recipe.source).find((key) => !CUSTOM_RECIPE_SOURCE_KEYS.has(key));
    if (invalidSourceKey) errors.push(issue("VFX_CUSTOM_RECIPE_SOURCE_FIELD_INVALID", `Unknown custom VFX recipe source field: ${invalidSourceKey}.`, `customRecipe.source.${invalidSourceKey}`));
    if (!isIdentifier(recipe.source.packageId)) errors.push(issue("VFX_CUSTOM_RECIPE_PACKAGE_ID_INVALID", "Custom VFX package ID is invalid.", "customRecipe.source.packageId"));
    if (typeof recipe.source.packageVersion !== "string" || !SEMVER_PATTERN.test(recipe.source.packageVersion)) errors.push(issue("VFX_CUSTOM_RECIPE_PACKAGE_VERSION_INVALID", "Custom VFX package version must be semantic versioning.", "customRecipe.source.packageVersion"));
    if (!isIdentifier(recipe.source.documentId)) errors.push(issue("VFX_CUSTOM_RECIPE_DOCUMENT_ID_INVALID", "Custom VFX document ID is invalid.", "customRecipe.source.documentId"));
  }
  if (!Array.isArray(recipe.descriptors) || recipe.descriptors.length > MAX_VFX_RECIPE_PRIMITIVES) {
    errors.push(issue("VFX_CUSTOM_RECIPE_PRIMITIVE_COUNT_INVALID", `Custom VFX recipes support 0-${MAX_VFX_RECIPE_PRIMITIVES} primitives.`, "customRecipe.descriptors"));
    return errors;
  }
  if (recipe.descriptors.some((_, index) => !Object.hasOwn(recipe.descriptors, index))) {
    errors.push(issue("VFX_CUSTOM_RECIPE_PRIMITIVES_INVALID", "Custom VFX recipe primitives must be dense.", "customRecipe.descriptors"));
    return errors;
  }
  const ids = new Set<string>();
  let particles = 0;
  let segments = 0;
  recipe.descriptors.forEach((descriptor, index) => {
    const path = `customRecipe.descriptors.${index}`;
    const result = validateVfxPrimitiveDescriptor(descriptor);
    if (!result.ok) {
      errors.push(...result.errors.map((entry) => ({ ...entry, path: `${path}.${entry.path ?? ""}`.replace(/\.$/, "") })));
      return;
    }
    if (ids.has(result.value.id)) errors.push(issue("VFX_CUSTOM_RECIPE_PRIMITIVE_ID_DUPLICATE", `Duplicate primitive ID: ${result.value.id}.`, `${path}.id`));
    ids.add(result.value.id);
    if (result.value.kind === "particle-emitter") particles += result.value.count;
    if (result.value.kind === "beam") segments += result.value.subdivisions;
    if (result.value.kind === "trail" || result.value.kind === "expanding-ring") segments += result.value.segments;
  });
  if (particles > VFX_GLOBAL_FRAME_LIMITS.particles || segments > VFX_GLOBAL_FRAME_LIMITS.segments || 1 + particles + segments > VFX_GLOBAL_FRAME_LIMITS.stackWork) {
    errors.push(issue("VFX_CUSTOM_RECIPE_BUDGET_EXCEEDED", "Custom VFX recipe exceeds the single-effect global frame budget.", "customRecipe.descriptors"));
  }
  return errors;
}

function validateParameterDefinition(
  parameter: VfxParameterDefinition,
  path: string
): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  if (!isParameterIdentifier(parameter.id)) {
    errors.push(
      issue("VFX_PARAMETER_ID_INVALID", "Parameter ID is invalid.", `${path}.id`)
    );
  }
  if (
    typeof parameter.displayName !== "string" ||
    parameter.displayName.trim() === ""
  ) {
    errors.push(
      issue(
        "VFX_PARAMETER_NAME_REQUIRED",
        "Parameter display name is required.",
        `${path}.displayName`
      )
    );
  }
  if (typeof parameter.animatable !== "boolean") {
    errors.push(
      issue(
        "VFX_PARAMETER_ANIMATABLE_INVALID",
        "Parameter animatable must be a boolean.",
        `${path}.animatable`
      )
    );
  }

  if (parameter.kind === "number" || parameter.kind === "integer") {
    if (!Number.isFinite(parameter.defaultValue)) {
      errors.push(
        issue(
          "VFX_PARAMETER_DEFAULT_INVALID",
          "Numeric parameter default must be finite.",
          `${path}.defaultValue`
        )
      );
    }
    if (
      parameter.kind === "integer" &&
      !Number.isSafeInteger(parameter.defaultValue)
    ) {
      errors.push(
        issue(
          "VFX_PARAMETER_DEFAULT_NOT_INTEGER",
          "Integer parameter default must be a safe integer.",
          `${path}.defaultValue`
        )
      );
    }
    if (
      parameter.min !== undefined &&
      (!Number.isFinite(parameter.min) ||
        (parameter.kind === "integer" &&
          !Number.isSafeInteger(parameter.min)))
    ) {
      errors.push(
        issue(
          "VFX_PARAMETER_MIN_INVALID",
          parameter.kind === "integer"
            ? "Integer minimum must be a safe integer."
            : "Minimum must be finite.",
          `${path}.min`
        )
      );
    }
    if (
      parameter.max !== undefined &&
      (!Number.isFinite(parameter.max) ||
        (parameter.kind === "integer" &&
          !Number.isSafeInteger(parameter.max)))
    ) {
      errors.push(
        issue(
          "VFX_PARAMETER_MAX_INVALID",
          parameter.kind === "integer"
            ? "Integer maximum must be a safe integer."
            : "Maximum must be finite.",
          `${path}.max`
        )
      );
    }
    if (
      parameter.min !== undefined &&
      parameter.max !== undefined &&
      parameter.min > parameter.max
    ) {
      errors.push(
        issue(
          "VFX_PARAMETER_RANGE_INVALID",
          "Parameter minimum cannot exceed maximum.",
          path
        )
      );
    }
    if (
      parameter.min !== undefined &&
      Number.isFinite(parameter.defaultValue) &&
      parameter.defaultValue < parameter.min
    ) {
      errors.push(
        issue(
          "VFX_PARAMETER_DEFAULT_BELOW_MIN",
          "Parameter default cannot be below its minimum.",
          `${path}.defaultValue`
        )
      );
    }
    if (
      parameter.max !== undefined &&
      Number.isFinite(parameter.defaultValue) &&
      parameter.defaultValue > parameter.max
    ) {
      errors.push(
        issue(
          "VFX_PARAMETER_DEFAULT_ABOVE_MAX",
          "Parameter default cannot exceed its maximum.",
          `${path}.defaultValue`
        )
      );
    }
    if (
      parameter.step !== undefined &&
      (!Number.isFinite(parameter.step) ||
        parameter.step <= 0 ||
        (parameter.kind === "integer" &&
          !Number.isSafeInteger(parameter.step)))
    ) {
      errors.push(
        issue(
          "VFX_PARAMETER_STEP_INVALID",
          parameter.kind === "integer"
            ? "Integer parameter step must be a positive safe integer."
            : "Parameter step must be finite and positive.",
          `${path}.step`
        )
      );
    }
  } else if (parameter.kind === "boolean") {
    if (typeof parameter.defaultValue !== "boolean") {
      errors.push(
        issue(
          "VFX_PARAMETER_DEFAULT_INVALID",
          "Boolean parameter default must be a boolean.",
          `${path}.defaultValue`
        )
      );
    }
  } else if (parameter.kind === "color") {
    if (!isSafeVfxColor(parameter.defaultValue)) {
      errors.push(
        issue(
          "VFX_PARAMETER_DEFAULT_INVALID",
          "Color parameter default must be a safe hex or named color.",
          `${path}.defaultValue`
        )
      );
    }
  } else if (parameter.kind === "enum") {
    const optionsAreInvalid =
      !Array.isArray(parameter.options) ||
      parameter.options.length === 0 ||
      parameter.options.some(
        (option) => typeof option !== "string" || option === ""
      );
    if (optionsAreInvalid) {
      errors.push(
        issue(
          "VFX_PARAMETER_OPTIONS_INVALID",
          "Enum parameter options must contain non-empty strings.",
          `${path}.options`
        )
      );
    } else {
      if (new Set(parameter.options).size !== parameter.options.length) {
        errors.push(
          issue(
            "VFX_PARAMETER_OPTIONS_DUPLICATE",
            "Enum parameter options must be unique.",
            `${path}.options`
          )
        );
      }
      if (!parameter.options.includes(parameter.defaultValue)) {
        errors.push(
          issue(
            "VFX_PARAMETER_DEFAULT_INVALID",
            "Enum parameter default must be one of its options.",
            `${path}.defaultValue`
          )
        );
      }
    }
  } else {
    errors.push(
      issue(
        "VFX_PARAMETER_KIND_INVALID",
        "Parameter kind is unsupported.",
        `${path}.kind`
      )
    );
  }

  return errors;
}

export function validateVfxDefinition(
  definition: VfxDefinition
): ValidationResult<VfxDefinition> {
  const errors: ValidationIssue[] = [];
  if (definition.version !== VFX_DEFINITION_VERSION) {
    errors.push(
      issue(
        "VFX_DEFINITION_VERSION_UNSUPPORTED",
        "VFX definition version is unsupported.",
        "version"
      )
    );
  }
  if (!isIdentifier(definition.id)) {
    errors.push(issue("VFX_DEFINITION_ID_INVALID", "VFX definition ID is invalid.", "id"));
  }
  if (typeof definition.displayName !== "string" || definition.displayName.trim() === "") {
    errors.push(
      issue(
        "VFX_DEFINITION_NAME_REQUIRED",
        "VFX definition display name is required.",
        "displayName"
      )
    );
  }
  if (!VFX_SPACES.has(definition.space)) {
    errors.push(issue("VFX_SPACE_INVALID", "VFX definition space is invalid.", "space"));
  }
  if (!Number.isSafeInteger(definition.defaultDurationFrames) || definition.defaultDurationFrames < 1) {
    errors.push(
      issue(
        "VFX_DURATION_INVALID",
        "Default duration must be a positive safe integer.",
        "defaultDurationFrames"
      )
    );
  }
  if (!VFX_BLEND_MODES.has(definition.defaultBlendMode)) {
    errors.push(
      issue("VFX_BLEND_MODE_INVALID", "Default blend mode is invalid.", "defaultBlendMode")
    );
  }
  if (!VFX_RENDER_LAYERS.has(definition.defaultRenderLayer)) {
    errors.push(
      issue("VFX_RENDER_LAYER_INVALID", "Default render layer is invalid.", "defaultRenderLayer")
    );
  }
  if (!Array.isArray(definition.tags) || definition.tags.some((tag) => typeof tag !== "string")) {
    errors.push(issue("VFX_TAGS_INVALID", "VFX tags must be strings.", "tags"));
  }
  if (!Array.isArray(definition.parameterSchema)) {
    errors.push(
      issue("VFX_PARAMETER_SCHEMA_INVALID", "VFX parameter schema must be an array.", "parameterSchema")
    );
  } else {
    const ids = new Set<string>();
    definition.parameterSchema.forEach((parameter, index) => {
      const path = `parameterSchema.${index}`;
      if (!parameter || typeof parameter !== "object") {
        errors.push(
          issue(
            "VFX_PARAMETER_SCHEMA_ENTRY_INVALID",
            "VFX parameter schema entries must be objects.",
            path
          )
        );
        return;
      }
      errors.push(...validateParameterDefinition(parameter, path));
      if (ids.has(parameter.id)) {
        errors.push(
          issue(
            "VFX_PARAMETER_ID_DUPLICATE",
            `Duplicate parameter ID: ${parameter.id}`,
            `${path}.id`
          )
        );
      }
      ids.add(parameter.id);
    });
  }

  return errors.length > 0 ? invalidResult(errors) : validResult(definition);
}

function validateParameterValue(
  parameter: VfxParameterDefinition,
  value: unknown,
  path: string
): ValidationIssue[] {
  if (!isVfxParameterValue(value)) {
    return [
      issue(
        "VFX_PARAMETER_VALUE_INVALID",
        "VFX parameter values must be finite numbers, strings, or booleans.",
        path
      )
    ];
  }

  if (parameter.kind === "number" || parameter.kind === "integer") {
    if (typeof value !== "number") {
      return [issue("VFX_PARAMETER_TYPE_MISMATCH", "Expected a number.", path)];
    }
    const errors: ValidationIssue[] = [];
    if (parameter.kind === "integer" && !Number.isSafeInteger(value)) {
      errors.push(
        issue("VFX_PARAMETER_NOT_INTEGER", "Expected a safe integer.", path)
      );
    }
    if (parameter.min !== undefined && value < parameter.min) {
      errors.push(issue("VFX_PARAMETER_BELOW_MIN", `Value must be at least ${parameter.min}.`, path));
    }
    if (parameter.max !== undefined && value > parameter.max) {
      errors.push(issue("VFX_PARAMETER_ABOVE_MAX", `Value must be at most ${parameter.max}.`, path));
    }
    return errors;
  }
  if (parameter.kind === "boolean" && typeof value !== "boolean") {
    return [issue("VFX_PARAMETER_TYPE_MISMATCH", "Expected a boolean.", path)];
  }
  if ((parameter.kind === "color" || parameter.kind === "enum") && typeof value !== "string") {
    return [issue("VFX_PARAMETER_TYPE_MISMATCH", "Expected a string.", path)];
  }
  if (parameter.kind === "color" && !isSafeVfxColor(value)) {
    return [
      issue(
        "VFX_PARAMETER_COLOR_INVALID",
        "Color must be a safe hex or named color.",
        path
      )
    ];
  }
  if (parameter.kind === "enum" && typeof value === "string" && !parameter.options.includes(value)) {
    return [issue("VFX_PARAMETER_ENUM_INVALID", "Value is not a supported option.", path)];
  }
  return [];
}

export function validateVfxInstance(
  instance: VfxInstance,
  definition: VfxDefinition | null
): ValidationResult<VfxInstance> {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (instance.serializationVersion !== VFX_INSTANCE_SERIALIZATION_VERSION) {
    errors.push(
      issue(
        "VFX_INSTANCE_VERSION_UNSUPPORTED",
        "VFX instance serialization version is unsupported.",
        "serializationVersion"
      )
    );
  }
  if (!isIdentifier(instance.id)) {
    errors.push(issue("VFX_INSTANCE_ID_INVALID", "VFX instance ID is invalid.", "id"));
  }
  if (!isIdentifier(instance.definitionId)) {
    errors.push(
      issue("VFX_DEFINITION_ID_INVALID", "VFX definition ID is invalid.", "definitionId")
    );
  }
  if (typeof instance.displayName !== "string" || instance.displayName.trim() === "") {
    errors.push(
      issue("VFX_INSTANCE_NAME_REQUIRED", "VFX instance display name is required.", "displayName")
    );
  }
  if (!Number.isSafeInteger(instance.startFrame) || instance.startFrame < 0) {
    errors.push(issue("VFX_START_FRAME_INVALID", "Start frame must be a non-negative safe integer.", "startFrame"));
  }
  if (!Number.isSafeInteger(instance.durationFrames) || instance.durationFrames < 1) {
    errors.push(issue("VFX_DURATION_INVALID", "Duration must be a positive safe integer.", "durationFrames"));
  }
  if (
    Number.isSafeInteger(instance.startFrame) &&
    Number.isSafeInteger(instance.durationFrames) &&
    !Number.isSafeInteger(instance.startFrame + instance.durationFrames)
  ) {
    errors.push(
      issue(
        "VFX_FRAME_RANGE_INVALID",
        "The inclusive VFX end frame must be a safe integer.",
        "durationFrames"
      )
    );
  }
  if (typeof instance.enabled !== "boolean") {
    errors.push(issue("VFX_ENABLED_INVALID", "Enabled must be a boolean.", "enabled"));
  }
  if (!VFX_SPACES.has(instance.space)) {
    errors.push(issue("VFX_SPACE_INVALID", "VFX instance space is invalid.", "space"));
  }
  if (
    !instance.transform ||
    !isFiniteVector3(instance.transform.position) ||
    !isFiniteVector3(instance.transform.rotation) ||
    !isFiniteVector3(instance.transform.scale)
  ) {
    errors.push(issue("VFX_TRANSFORM_INVALID", "VFX transform must contain finite vector3 tuples.", "transform"));
  }
  if (
    instance.target !== null &&
    (!instance.target || typeof instance.target.entityId !== "string" || instance.target.entityId.trim() === "")
  ) {
    errors.push(issue("VFX_TARGET_INVALID", "VFX target entity ID cannot be empty.", "target.entityId"));
  }
  if (
    instance.target?.boneId !== undefined &&
    (typeof instance.target.boneId !== "string" || instance.target.boneId.trim() === "")
  ) {
    errors.push(issue("VFX_TARGET_BONE_INVALID", "VFX target bone ID cannot be empty.", "target.boneId"));
  }
  if (typeof instance.seed !== "string" || instance.seed.trim() === "") {
    errors.push(issue("VFX_SEED_REQUIRED", "VFX seed is required.", "seed"));
  }
  if (!VFX_BLEND_MODES.has(instance.blendMode)) {
    errors.push(issue("VFX_BLEND_MODE_INVALID", "VFX blend mode is invalid.", "blendMode"));
  }
  if (!VFX_RENDER_LAYERS.has(instance.renderLayer)) {
    errors.push(issue("VFX_RENDER_LAYER_INVALID", "VFX render layer is invalid.", "renderLayer"));
  }
  if (!VFX_QUALITIES.has(instance.previewQuality)) {
    errors.push(issue("VFX_PREVIEW_QUALITY_INVALID", "Preview quality is invalid.", "previewQuality"));
  }
  if (!VFX_QUALITIES.has(instance.exportQuality)) {
    errors.push(issue("VFX_EXPORT_QUALITY_INVALID", "Export quality is invalid.", "exportQuality"));
  }

  if (!definition) {
    errors.push(
      issue(
        "VFX_DEFINITION_NOT_FOUND",
        `VFX definition was not found: ${instance.definitionId}`,
        "definitionId"
      )
    );
  } else {
    if (definition.id !== instance.definitionId) {
      errors.push(
        issue(
          "VFX_DEFINITION_MISMATCH",
          "VFX instance does not match the supplied definition.",
          "definitionId"
        )
      );
    }
    if (definition.space !== instance.space && instance.customRecipe === undefined) {
      errors.push(
        issue(
          "VFX_SPACE_MISMATCH",
          "VFX instance space does not match its definition.",
          "space"
        )
      );
    }
  }

  errors.push(...validateCustomRecipe(instance));

  if (!isRecord(instance.parameters)) {
    errors.push(issue("VFX_PARAMETERS_INVALID", "VFX parameters must be an object.", "parameters"));
  } else {
    const schemaById = new Map(
      (definition?.parameterSchema ?? []).map((parameter) => [parameter.id, parameter])
    );
    for (const [parameterId, value] of Object.entries(instance.parameters)) {
      const path = `parameters.${parameterId}`;
      const parameter = schemaById.get(parameterId);
      if (!parameter) {
        if (!isVfxParameterValue(value)) {
          errors.push(
            issue(
              "VFX_PARAMETER_VALUE_INVALID",
              "Unknown parameter values must still be finite numbers, strings, or booleans.",
              path
            )
          );
        } else {
          warnings.push(
            issue(
              "VFX_PARAMETER_UNKNOWN",
              `Unknown parameter is preserved: ${parameterId}`,
              path,
              "warning"
            )
          );
        }
        continue;
      }
      errors.push(...validateParameterValue(parameter, value, path));
    }
  }

  if (!Array.isArray(instance.parameterKeyframes)) {
    errors.push(
      issue(
        "VFX_PARAMETER_KEYFRAMES_INVALID",
        "VFX parameter keyframes must be an array.",
        "parameterKeyframes"
      )
    );
  } else if (instance.parameterKeyframes.length > MAX_VFX_PARAMETER_KEYFRAMES) {
    errors.push(
      issue(
        "VFX_PARAMETER_KEYFRAMES_LIMIT_EXCEEDED",
        `VFX parameter keyframes cannot exceed ${MAX_VFX_PARAMETER_KEYFRAMES}.`,
        "parameterKeyframes"
      )
    );
  } else {
    const keyframeIds = new Set<string>();
    const schemaById = new Map(
      (definition?.parameterSchema ?? []).map((parameter) => [parameter.id, parameter])
    );
    for (let index = 0; index < instance.parameterKeyframes.length; index += 1) {
      const path = `parameterKeyframes.${index}`;
      if (!Object.hasOwn(instance.parameterKeyframes, index)) {
        errors.push(
          issue(
            "VFX_PARAMETER_KEYFRAMES_INVALID",
            "VFX parameter keyframes must be dense.",
            path
          )
        );
        continue;
      }
      const keyframe = instance.parameterKeyframes[index];
      if (!isRecord(keyframe)) {
        errors.push(
          issue(
            "VFX_PARAMETER_KEYFRAME_INVALID",
            "VFX parameter keyframes must be objects.",
            path
          )
        );
        continue;
      }
      if (!isIdentifier(keyframe.id)) {
        errors.push(
          issue(
            "VFX_PARAMETER_KEYFRAME_ID_INVALID",
            "VFX parameter keyframe ID is invalid.",
            `${path}.id`
          )
        );
      } else if (keyframeIds.has(keyframe.id)) {
        errors.push(
          issue(
            "VFX_PARAMETER_KEYFRAME_ID_DUPLICATE",
            `Duplicate VFX parameter keyframe ID: ${keyframe.id}.`,
            `${path}.id`
          )
        );
      } else {
        keyframeIds.add(keyframe.id);
      }
      if (!isParameterIdentifier(keyframe.parameterId)) {
        errors.push(
          issue(
            "VFX_PARAMETER_KEYFRAME_PARAMETER_INVALID",
            "VFX parameter keyframe parameter ID is invalid.",
            `${path}.parameterId`
          )
        );
      }
      if (
        typeof keyframe.localFrame !== "number" ||
        !Number.isSafeInteger(keyframe.localFrame) ||
        keyframe.localFrame < 0 ||
        keyframe.localFrame > instance.durationFrames
      ) {
        errors.push(
          issue(
            "VFX_PARAMETER_KEYFRAME_FRAME_INVALID",
            "VFX parameter keyframe local frame must be inside the inclusive effect range.",
            `${path}.localFrame`
          )
        );
      }
      if (!VFX_PARAMETER_KEYFRAME_INTERPOLATIONS.has(
        keyframe.interpolation as VfxParameterKeyframeInterpolation
      )) {
        errors.push(
          issue(
            "VFX_PARAMETER_KEYFRAME_INTERPOLATION_INVALID",
            "VFX parameter keyframe interpolation is invalid.",
            `${path}.interpolation`
          )
        );
      }
      const parameter = schemaById.get(String(keyframe.parameterId));
      if (parameter) {
        if (!parameter.animatable) {
          errors.push(
            issue(
              "VFX_PARAMETER_KEYFRAME_NOT_ANIMATABLE",
              `VFX parameter does not support keyframes: ${parameter.id}.`,
              `${path}.parameterId`
            )
          );
        }
        errors.push(
          ...validateParameterValue(parameter, keyframe.value, `${path}.value`)
        );
      } else if (isVfxParameterValue(keyframe.value)) {
        warnings.push(
          issue(
            "VFX_PARAMETER_KEYFRAME_UNKNOWN",
            `Keyframe for unknown parameter is preserved: ${String(keyframe.parameterId)}.`,
            `${path}.parameterId`,
            "warning"
          )
        );
      } else {
        errors.push(
          issue(
            "VFX_PARAMETER_KEYFRAME_VALUE_INVALID",
            "Unknown parameter keyframe values must still be finite primitive values.",
            `${path}.value`
          )
        );
      }
    }
  }

  return errors.length > 0
    ? invalidResult(errors, warnings)
    : validResult(instance, warnings);
}
