import type { ValidationIssue } from "../core/serialization/ValidationResult";
import {
  MAX_VFX_PARAMETER_ID_LENGTH,
  MAX_VFX_PARAMETER_STRING_LENGTH
} from "../vfx/core/VfxParameter";
import type { EffectInstance, EffectParameters } from "./EffectTypes";

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/;
const MAX_ID_LENGTH = 128;
const MAX_PARAMETER_PATCH_ENTRIES = 64;
const EDITABLE_PATCH_KEYS = new Set([
  "name",
  "startFrame",
  "durationFrames",
  "position",
  "targetObjectId",
  "parameters",
  "enabled"
]);

type RecordValue = Record<string, unknown>;

export function effectTimelineIssue(
  code: string,
  message: string,
  path: string
): ValidationIssue {
  return { code, message, path, severity: "error" };
}

export function isEffectTimelineRecord(
  value: unknown
): value is RecordValue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return false;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    return Reflect.ownKeys(descriptors).every((key) => {
      if (typeof key === "symbol") return false;
      const descriptor = descriptors[key];
      return Boolean(
        descriptor &&
          "value" in descriptor &&
          descriptor.enumerable
      );
    });
  } catch {
    return false;
  }
}

export function isEffectTimelineIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= MAX_ID_LENGTH &&
    IDENTIFIER_PATTERN.test(value)
  );
}

export function isEffectTimelineVector3(
  value: unknown
): value is [number, number, number] {
  if (!Array.isArray(value)) return false;
  try {
    if (Object.getPrototypeOf(value) !== Array.prototype) return false;
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    if (!lengthDescriptor || lengthDescriptor.value !== 3) return false;
    return [0, 1, 2].every((index) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      return Boolean(
        descriptor &&
          "value" in descriptor &&
          descriptor.enumerable &&
          typeof descriptor.value === "number" &&
          Number.isFinite(descriptor.value)
      );
    });
  } catch {
    return false;
  }
}

export function isEffectTimelineParameterRecord(
  value: unknown
): value is EffectParameters {
  if (!isEffectTimelineRecord(value)) return false;
  return Object.values(value).every(
    (parameter) =>
      typeof parameter === "string" ||
      typeof parameter === "boolean" ||
      (typeof parameter === "number" && Number.isFinite(parameter))
  );
}

function isParameterPatchRecord(value: unknown): value is EffectParameters {
  if (!isEffectTimelineParameterRecord(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length <= MAX_PARAMETER_PATCH_ENTRIES &&
    entries.every(
      ([key, parameter]) =>
        key.length <= MAX_VFX_PARAMETER_ID_LENGTH &&
        (typeof parameter !== "string" ||
          parameter.length <= MAX_VFX_PARAMETER_STRING_LENGTH)
    )
  );
}

export function validateEffectTimelineTargetId(
  effects: readonly EffectInstance[],
  effectId: unknown,
  path = "effectId"
): ValidationIssue | null {
  if (!isEffectTimelineIdentifier(effectId)) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_ID_INVALID",
      "Effect ID is invalid.",
      path
    );
  }
  if (!effects.some((effect) => effect.id === effectId)) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_EFFECT_NOT_FOUND",
      `Effect ${effectId} does not exist.`,
      path
    );
  }
  return null;
}

export function validateEffectTimelineNewId(
  effects: readonly EffectInstance[],
  newEffectId: unknown
): ValidationIssue | null {
  if (!isEffectTimelineIdentifier(newEffectId)) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_ID_INVALID",
      "New effect ID is invalid.",
      "newEffectId"
    );
  }
  if (effects.some((effect) => effect.id === newEffectId)) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_ID_DUPLICATE",
      `Effect ID ${newEffectId} already exists.`,
      "newEffectId"
    );
  }
  return null;
}

export function validateEffectTimelinePatch(
  value: unknown
): ValidationIssue | null {
  if (!isEffectTimelineRecord(value)) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_PATCH_INVALID",
      "Effect patch must be an object.",
      "patch"
    );
  }
  const invalidKey = Object.keys(value).find(
    (key) => !EDITABLE_PATCH_KEYS.has(key)
  );
  if (invalidKey) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_PATCH_INVALID",
      `Effect field ${invalidKey} is not editable through the timeline.`,
      `patch.${invalidKey}`
    );
  }
  if (
    "name" in value &&
    (typeof value.name !== "string" || value.name.trim() === "")
  ) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_NAME_INVALID",
      "Effect name is required.",
      "patch.name"
    );
  }
  if (
    "startFrame" in value &&
    (!Number.isSafeInteger(value.startFrame) ||
      (value.startFrame as number) < 0)
  ) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_START_FRAME_INVALID",
      "Effect start frame must be a non-negative safe integer.",
      "patch.startFrame"
    );
  }
  if (
    "durationFrames" in value &&
    (!Number.isSafeInteger(value.durationFrames) ||
      (value.durationFrames as number) < 1)
  ) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_DURATION_INVALID",
      "Effect duration must be a positive safe integer.",
      "patch.durationFrames"
    );
  }
  if ("position" in value && !isEffectTimelineVector3(value.position)) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_POSITION_INVALID",
      "Effect position must contain three finite numbers.",
      "patch.position"
    );
  }
  if ("targetObjectId" in value && typeof value.targetObjectId !== "string") {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_TARGET_INVALID",
      "Effect target ID must be a string.",
      "patch.targetObjectId"
    );
  }
  if ("parameters" in value && !isParameterPatchRecord(value.parameters)) {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_PARAMETERS_INVALID",
      "Effect parameter patches must contain bounded finite primitive values.",
      "patch.parameters"
    );
  }
  if ("enabled" in value && typeof value.enabled !== "boolean") {
    return effectTimelineIssue(
      "EFFECT_TIMELINE_ENABLED_INVALID",
      "Effect enabled state must be a boolean.",
      "patch.enabled"
    );
  }
  return null;
}
