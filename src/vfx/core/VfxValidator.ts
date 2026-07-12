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
  VFX_INSTANCE_SERIALIZATION_VERSION,
  type VfxInstance
} from "./VfxInstance";
import { isVfxParameterValue } from "./VfxParameter";
import type { VfxParameterDefinition } from "./VfxParameterSchema";

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

function validateParameterDefinition(
  parameter: VfxParameterDefinition,
  path: string
): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  if (!isIdentifier(parameter.id)) {
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
      !Number.isInteger(parameter.defaultValue)
    ) {
      errors.push(
        issue(
          "VFX_PARAMETER_DEFAULT_NOT_INTEGER",
          "Integer parameter default must be an integer.",
          `${path}.defaultValue`
        )
      );
    }
    if (parameter.min !== undefined && !Number.isFinite(parameter.min)) {
      errors.push(
        issue("VFX_PARAMETER_MIN_INVALID", "Minimum must be finite.", `${path}.min`)
      );
    }
    if (parameter.max !== undefined && !Number.isFinite(parameter.max)) {
      errors.push(
        issue("VFX_PARAMETER_MAX_INVALID", "Maximum must be finite.", `${path}.max`)
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
      (!Number.isFinite(parameter.step) || parameter.step <= 0)
    ) {
      errors.push(
        issue(
          "VFX_PARAMETER_STEP_INVALID",
          "Parameter step must be finite and positive.",
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
    if (
      typeof parameter.defaultValue !== "string" ||
      parameter.defaultValue.trim() === ""
    ) {
      errors.push(
        issue(
          "VFX_PARAMETER_DEFAULT_INVALID",
          "Color parameter default must be a non-empty string.",
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
    if (parameter.kind === "integer" && !Number.isInteger(value)) {
      errors.push(issue("VFX_PARAMETER_NOT_INTEGER", "Expected an integer.", path));
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
  if (parameter.kind === "color" && typeof value === "string" && value.trim() === "") {
    return [issue("VFX_PARAMETER_COLOR_EMPTY", "Color cannot be empty.", path)];
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
    if (definition.space !== instance.space) {
      errors.push(
        issue(
          "VFX_SPACE_MISMATCH",
          "VFX instance space does not match its definition.",
          "space"
        )
      );
    }
  }

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

  return errors.length > 0
    ? invalidResult(errors, warnings)
    : validResult(instance, warnings);
}
