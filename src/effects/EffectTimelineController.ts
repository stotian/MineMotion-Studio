import {
  invalidResult,
  validResult,
  type ValidationIssue,
  type ValidationResult
} from "../core/serialization/ValidationResult";
import type { MineMotionProject } from "../project/ProjectFile";
import { sanitizeTimelineTracks } from "../project/TimelineTrackSanitizer";
import {
  adaptLegacyEffectDefinition,
  adaptLegacyEffectInstance
} from "../vfx/compat/LegacyEffectAdapter";
import { validateVfxInstance } from "../vfx/core/VfxValidator";
import { effectRegistry } from "./EffectRegistry";
import type {
  EffectInstance,
  EffectParameters,
  EffectType
} from "./EffectTypes";
import {
  MAX_EFFECT_INSTANCES,
  MAX_LEGACY_EFFECT_PARTICLE_COUNT
} from "./EffectTypes";
import { syncEffectTimelineLane } from "./EffectTimelineTrack";

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/;
const MAX_ID_LENGTH = 128;
const EDITABLE_PATCH_KEYS = new Set([
  "name",
  "startFrame",
  "durationFrames",
  "position",
  "targetObjectId",
  "parameters",
  "enabled"
]);
const COMMAND_TYPES = new Set([
  "insert",
  "update",
  "move",
  "trim-start",
  "trim-end",
  "duplicate",
  "paste",
  "set-enabled",
  "reorder",
  "delete"
]);
const EFFECT_INSTANCE_KEYS = new Set([
  "id",
  "type",
  "name",
  "startFrame",
  "durationFrames",
  "position",
  "targetObjectId",
  "parameters",
  "enabled"
]);

export const EFFECT_TIMELINE_CLIPBOARD_VERSION = 1 as const;

export interface EffectTimelineClipboardV1 {
  version: typeof EFFECT_TIMELINE_CLIPBOARD_VERSION;
  effect: EffectInstance;
}

export interface EffectTimelineEditablePatch {
  name?: string;
  startFrame?: number;
  durationFrames?: number;
  position?: [number, number, number];
  targetObjectId?: string;
  parameters?: Partial<EffectParameters>;
  enabled?: boolean;
}

export type EffectTimelineCommand =
  | { type: "insert"; effect: EffectInstance }
  | {
      type: "update";
      effectId: string;
      patch: EffectTimelineEditablePatch;
    }
  | { type: "move"; effectId: string; startFrame: number }
  | { type: "trim-start"; effectId: string; startFrame: number }
  | { type: "trim-end"; effectId: string; endFrame: number }
  | {
      type: "duplicate";
      effectId: string;
      newEffectId: string;
      startFrame: number;
    }
  | {
      type: "paste";
      clipboard: EffectTimelineClipboardV1;
      newEffectId: string;
      startFrame: number;
    }
  | { type: "set-enabled"; effectId: string; enabled: boolean }
  | { type: "reorder"; effectId: string; toIndex: number }
  | { type: "delete"; effectId: string };

export interface EffectTimelineMutation {
  project: MineMotionProject;
  changed: boolean;
  selectedEffectId: string | null;
  historyLabel: string;
}

type RecordValue = Record<string, unknown>;

function normalizeNumber(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function issue(code: string, message: string, path: string): ValidationIssue {
  return { code, message, path, severity: "error" };
}

function failure<T>(error: ValidationIssue): ValidationResult<T> {
  return invalidResult([error]);
}

function isRecord(value: unknown): value is RecordValue {
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

function isIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= MAX_ID_LENGTH &&
    IDENTIFIER_PATTERN.test(value)
  );
}

function isFiniteVector3(value: unknown): value is [number, number, number] {
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

function isParameterRecord(value: unknown): value is EffectParameters {
  if (!isRecord(value)) return false;
  return Object.values(value).every(
    (parameter) =>
      typeof parameter === "string" ||
      typeof parameter === "boolean" ||
      (typeof parameter === "number" && Number.isFinite(parameter))
  );
}

function validateTiming(
  startFrame: unknown,
  durationFrames: unknown,
  path: string
): ValidationIssue | null {
  if (!Number.isSafeInteger(startFrame) || (startFrame as number) < 0) {
    return issue(
      "EFFECT_TIMELINE_START_FRAME_INVALID",
      "Effect start frame must be a non-negative safe integer.",
      `${path}.startFrame`
    );
  }
  if (!Number.isSafeInteger(durationFrames) || (durationFrames as number) < 1) {
    return issue(
      "EFFECT_TIMELINE_DURATION_INVALID",
      "Effect duration must be a positive safe integer.",
      `${path}.durationFrames`
    );
  }
  if (!Number.isSafeInteger((startFrame as number) + (durationFrames as number))) {
    return issue(
      "EFFECT_TIMELINE_FRAME_RANGE_INVALID",
      "The inclusive effect end frame must be a safe integer.",
      `${path}.durationFrames`
    );
  }
  return null;
}

function validateTimelineTiming(
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
    return issue(
      "EFFECT_TIMELINE_FRAME_OUT_OF_RANGE",
      "Effect timing must remain inside the project timeline.",
      `${path}.durationFrames`
    );
  }
  return null;
}

function validateKnownParameters(effect: EffectInstance): ValidationIssue | null {
  const count = effect.parameters.count;
  if (
    count !== undefined &&
    (!Number.isSafeInteger(count) ||
      count < 0 ||
      count > MAX_LEGACY_EFFECT_PARTICLE_COUNT)
  ) {
    return issue(
      "EFFECT_TIMELINE_PARAMETER_INVALID",
      `Particle count must be an integer between 0 and ${MAX_LEGACY_EFFECT_PARTICLE_COUNT}.`,
      "parameters.count"
    );
  }

  try {
    const definition = effectRegistry.get(effect.type);
    if (!definition) {
      return issue(
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
        return issue(
          "EFFECT_TIMELINE_PARAMETER_INVALID",
          parameterError.message,
          parameterError.path ?? "parameters"
        );
      }
    }
  } catch (error) {
    return issue(
      "EFFECT_TIMELINE_PARAMETER_INVALID",
      error instanceof Error ? error.message : "Effect parameters are invalid.",
      "parameters"
    );
  }
  return null;
}

function validateEffect(
  value: unknown,
  path: string,
  enforceKnownParameterBounds = true
): ValidationIssue | null {
  if (!isRecord(value)) {
    return issue(
      "EFFECT_TIMELINE_EFFECT_INVALID",
      "Effect data must be an object.",
      path
    );
  }
  const invalidKey = Object.keys(value).find(
    (key) => !EFFECT_INSTANCE_KEYS.has(key)
  );
  if (invalidKey) {
    return issue(
      "EFFECT_TIMELINE_EFFECT_INVALID",
      `Effect field ${invalidKey} is outside the serialized effect contract.`,
      `${path}.${invalidKey}`
    );
  }
  if (!isIdentifier(value.id)) {
    return issue(
      "EFFECT_TIMELINE_ID_INVALID",
      "Effect ID is invalid.",
      `${path}.id`
    );
  }
  if (typeof value.type !== "string" || !effectRegistry.get(value.type as EffectType)) {
    return issue(
      "EFFECT_TIMELINE_EFFECT_TYPE_INVALID",
      "Effect type is not registered.",
      `${path}.type`
    );
  }
  if (typeof value.name !== "string" || value.name.trim() === "") {
    return issue(
      "EFFECT_TIMELINE_NAME_INVALID",
      "Effect name is required.",
      `${path}.name`
    );
  }
  const timingError = validateTiming(value.startFrame, value.durationFrames, path);
  if (timingError) return timingError;
  if (!isFiniteVector3(value.position)) {
    return issue(
      "EFFECT_TIMELINE_POSITION_INVALID",
      "Effect position must contain three finite numbers.",
      `${path}.position`
    );
  }
  if (typeof value.targetObjectId !== "string") {
    return issue(
      "EFFECT_TIMELINE_TARGET_INVALID",
      "Effect target ID must be a string.",
      `${path}.targetObjectId`
    );
  }
  if (!isParameterRecord(value.parameters)) {
    return issue(
      "EFFECT_TIMELINE_PARAMETERS_INVALID",
      "Effect parameters must contain finite primitive values.",
      `${path}.parameters`
    );
  }
  if (typeof value.enabled !== "boolean") {
    return issue(
      "EFFECT_TIMELINE_ENABLED_INVALID",
      "Effect enabled state must be a boolean.",
      `${path}.enabled`
    );
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

function validateProjectEffects(project: MineMotionProject): ValidationIssue | null {
  if (
    !isRecord(project) ||
    !isRecord(project.effects) ||
    !Array.isArray(project.effects.instances)
  ) {
    return issue(
      "EFFECT_TIMELINE_PROJECT_INVALID",
      "Project effects.instances must be an array.",
      "effects.instances"
    );
  }
  if (
    !isRecord(project.animation) ||
    !Array.isArray(project.animation.timelineTracks) ||
    !Number.isSafeInteger(project.animation.durationFrames) ||
    project.animation.durationFrames < 1
  ) {
    return issue(
      "EFFECT_TIMELINE_PROJECT_INVALID",
      "Project animation timeline data is invalid.",
      "animation"
    );
  }
  try {
    sanitizeTimelineTracks(project.animation.timelineTracks);
  } catch (error) {
    return issue(
      "EFFECT_TIMELINE_PROJECT_INVALID",
      error instanceof Error ? error.message : "Project timeline tracks are invalid.",
      "animation.timelineTracks"
    );
  }
  const seen = new Set<string>();
  for (let index = 0; index < project.effects.instances.length; index += 1) {
    const effect = project.effects.instances[index];
    const effectError = validateEffect(
      effect,
      `effects.instances[${index}]`,
      false
    );
    if (effectError) return effectError;
    if (seen.has(effect.id)) {
      return issue(
        "EFFECT_TIMELINE_ID_DUPLICATE",
        `Effect ID ${effect.id} is duplicated.`,
        `effects.instances[${index}].id`
      );
    }
    seen.add(effect.id);
  }
  return null;
}

function cloneEffect(effect: EffectInstance): EffectInstance {
  return {
    id: effect.id,
    type: effect.type,
    name: effect.name,
    startFrame: normalizeNumber(effect.startFrame),
    durationFrames: normalizeNumber(effect.durationFrames),
    position: [
      normalizeNumber(effect.position[0]),
      normalizeNumber(effect.position[1]),
      normalizeNumber(effect.position[2])
    ],
    targetObjectId: effect.targetObjectId,
    parameters: Object.fromEntries(
      Object.entries(effect.parameters).map(([key, value]) => [
        key,
        typeof value === "number" ? normalizeNumber(value) : value
      ])
    ) as EffectParameters,
    enabled: effect.enabled
  };
}

function sameParameters(
  left: EffectParameters,
  right: EffectParameters
): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] &&
        Object.is(
          left[key as keyof EffectParameters],
          right[key as keyof EffectParameters]
        )
    )
  );
}

function sameEffect(left: EffectInstance, right: EffectInstance): boolean {
  return (
    left.id === right.id &&
    left.type === right.type &&
    left.name === right.name &&
    left.startFrame === right.startFrame &&
    left.durationFrames === right.durationFrames &&
    left.position.every((component, index) => component === right.position[index]) &&
    left.targetObjectId === right.targetObjectId &&
    sameParameters(left.parameters, right.parameters) &&
    left.enabled === right.enabled
  );
}

function validateTargetId(
  effects: readonly EffectInstance[],
  effectId: unknown,
  path = "effectId"
): ValidationIssue | null {
  if (!isIdentifier(effectId)) {
    return issue(
      "EFFECT_TIMELINE_ID_INVALID",
      "Effect ID is invalid.",
      path
    );
  }
  if (!effects.some((effect) => effect.id === effectId)) {
    return issue(
      "EFFECT_TIMELINE_EFFECT_NOT_FOUND",
      `Effect ${effectId} does not exist.`,
      path
    );
  }
  return null;
}

function validateNewId(
  effects: readonly EffectInstance[],
  newEffectId: unknown
): ValidationIssue | null {
  if (!isIdentifier(newEffectId)) {
    return issue(
      "EFFECT_TIMELINE_ID_INVALID",
      "New effect ID is invalid.",
      "newEffectId"
    );
  }
  if (effects.some((effect) => effect.id === newEffectId)) {
    return issue(
      "EFFECT_TIMELINE_ID_DUPLICATE",
      `Effect ID ${newEffectId} already exists.`,
      "newEffectId"
    );
  }
  return null;
}

function mutation(
  project: MineMotionProject,
  instances: EffectInstance[],
  selectedEffectId: string | null,
  historyLabel: string
): ValidationResult<EffectTimelineMutation> {
  if (
    instances.length > MAX_EFFECT_INSTANCES &&
    instances.length > project.effects.instances.length
  ) {
    return failure(
      issue(
        "EFFECT_TIMELINE_EFFECT_LIMIT_EXCEEDED",
        `Project effects.instances cannot exceed ${MAX_EFFECT_INSTANCES} effects.`,
        "effects.instances"
      )
    );
  }
  const timelineTracks = sanitizeTimelineTracks(
    project.animation.timelineTracks
  );
  return validResult({
    project: syncEffectTimelineLane({
      ...project,
      animation: { ...project.animation, timelineTracks },
      effects: { instances }
    }),
    changed: true,
    selectedEffectId,
    historyLabel
  });
}

function noChange(
  project: MineMotionProject,
  selectedEffectId: string | null,
  historyLabel: string
): ValidationResult<EffectTimelineMutation> {
  return validResult({
    project,
    changed: false,
    selectedEffectId,
    historyLabel
  });
}

function replaceEffect(
  effects: readonly EffectInstance[],
  effectId: string,
  replacement: EffectInstance
): EffectInstance[] {
  return effects.map((effect) =>
    effect.id === effectId ? replacement : effect
  );
}

function validatePatch(value: unknown): ValidationIssue | null {
  if (!isRecord(value)) {
    return issue(
      "EFFECT_TIMELINE_PATCH_INVALID",
      "Effect patch must be an object.",
      "patch"
    );
  }
  const invalidKey = Object.keys(value).find(
    (key) => !EDITABLE_PATCH_KEYS.has(key)
  );
  if (invalidKey) {
    return issue(
      "EFFECT_TIMELINE_PATCH_INVALID",
      `Effect field ${invalidKey} is not editable through the timeline.`,
      `patch.${invalidKey}`
    );
  }
  if (
    "name" in value &&
    (typeof value.name !== "string" || value.name.trim() === "")
  ) {
    return issue(
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
    return issue(
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
    return issue(
      "EFFECT_TIMELINE_DURATION_INVALID",
      "Effect duration must be a positive safe integer.",
      "patch.durationFrames"
    );
  }
  if ("position" in value && !isFiniteVector3(value.position)) {
    return issue(
      "EFFECT_TIMELINE_POSITION_INVALID",
      "Effect position must contain three finite numbers.",
      "patch.position"
    );
  }
  if ("targetObjectId" in value && typeof value.targetObjectId !== "string") {
    return issue(
      "EFFECT_TIMELINE_TARGET_INVALID",
      "Effect target ID must be a string.",
      "patch.targetObjectId"
    );
  }
  if ("parameters" in value && !isParameterRecord(value.parameters)) {
    return issue(
      "EFFECT_TIMELINE_PARAMETERS_INVALID",
      "Effect parameters must contain finite primitive values.",
      "patch.parameters"
    );
  }
  if ("enabled" in value && typeof value.enabled !== "boolean") {
    return issue(
      "EFFECT_TIMELINE_ENABLED_INVALID",
      "Effect enabled state must be a boolean.",
      "patch.enabled"
    );
  }
  return null;
}

export function copyEffectTimelineBlock(
  project: MineMotionProject,
  effectId: string
): ValidationResult<EffectTimelineClipboardV1> {
  const projectError = validateProjectEffects(project);
  if (projectError) return failure(projectError);
  const targetError = validateTargetId(project.effects.instances, effectId);
  if (targetError) return failure(targetError);
  const effect = project.effects.instances.find((item) => item.id === effectId);
  if (!effect) {
    return failure(
      issue(
        "EFFECT_TIMELINE_EFFECT_NOT_FOUND",
        `Effect ${effectId} does not exist.`,
        "effectId"
      )
    );
  }
  return validResult({
    version: EFFECT_TIMELINE_CLIPBOARD_VERSION,
    effect: cloneEffect(effect)
  });
}

export function applyEffectTimelineCommand(
  project: MineMotionProject,
  command: EffectTimelineCommand | unknown
): ValidationResult<EffectTimelineMutation> {
  const projectError = validateProjectEffects(project);
  if (projectError) return failure(projectError);
  if (!isRecord(command) || typeof command.type !== "string") {
    return failure(
      issue(
        "EFFECT_TIMELINE_COMMAND_INVALID",
        "Effect timeline command is invalid.",
        "command"
      )
    );
  }
  if (!COMMAND_TYPES.has(command.type)) {
    return failure(
      issue(
        "EFFECT_TIMELINE_COMMAND_INVALID",
        `Unknown effect timeline command: ${command.type}.`,
        "command.type"
      )
    );
  }

  const effects = project.effects.instances;
  if (command.type === "insert") {
    const effectError = validateEffect(command.effect, "effect");
    if (effectError) return failure(effectError);
    const source = command.effect as EffectInstance;
    const idError = validateNewId(effects, source.id);
    if (idError) return failure(idError);
    const timingError = validateTimelineTiming(
      project,
      source.startFrame,
      source.durationFrames,
      "effect"
    );
    if (timingError) return failure(timingError);
    return mutation(
      project,
      [...effects, cloneEffect(source)],
      source.id,
      "Add cinematic effect"
    );
  }

  if (command.type === "paste") {
    const idError = validateNewId(effects, command.newEffectId);
    if (idError) return failure(idError);
    if (
      !isRecord(command.clipboard) ||
      command.clipboard.version !== EFFECT_TIMELINE_CLIPBOARD_VERSION
    ) {
      return failure(
        issue(
          "EFFECT_TIMELINE_CLIPBOARD_INVALID",
          "Effect clipboard version is unsupported.",
          "clipboard"
        )
      );
    }
    const clipboardEffectError = validateEffect(
      command.clipboard.effect,
      "clipboard.effect"
    );
    if (clipboardEffectError) {
      return failure(
        issue(
          "EFFECT_TIMELINE_CLIPBOARD_INVALID",
          clipboardEffectError.message,
          clipboardEffectError.path ?? "clipboard.effect"
        )
      );
    }
    const source = command.clipboard.effect as EffectInstance;
    const timingError = validateTimelineTiming(
      project,
      command.startFrame,
      source.durationFrames,
      "command"
    );
    if (timingError) return failure(timingError);
    const pasted = {
      ...cloneEffect(source),
      id: command.newEffectId as string,
      name: `${source.name} Copy`,
      startFrame: normalizeNumber(command.startFrame as number)
    };
    return mutation(
      project,
      [...effects, pasted],
      pasted.id,
      "Paste cinematic effect"
    );
  }

  const targetError = validateTargetId(effects, command.effectId);
  if (targetError) return failure(targetError);
  const effectId = command.effectId as string;
  const index = effects.findIndex((effect) => effect.id === effectId);
  const source = effects[index];

  if (command.type === "update") {
    const patchError = validatePatch(command.patch);
    if (patchError) return failure(patchError);
    const patch = command.patch as EffectTimelineEditablePatch;
    const updatedValue: EffectInstance = {
      ...source,
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.startFrame !== undefined
        ? { startFrame: patch.startFrame }
        : {}),
      ...(patch.durationFrames !== undefined
        ? { durationFrames: patch.durationFrames }
        : {}),
      ...(patch.position !== undefined
        ? { position: [...patch.position] as [number, number, number] }
        : {}),
      ...(patch.targetObjectId !== undefined
        ? { targetObjectId: patch.targetObjectId }
        : {}),
      ...(patch.parameters !== undefined
        ? { parameters: { ...source.parameters, ...patch.parameters } }
        : {}),
      ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {})
    };
    const updated = cloneEffect(updatedValue);
    const updatedError = validateEffect(updated, "effect");
    if (updatedError) return failure(updatedError);
    if (
      Object.hasOwn(patch, "startFrame") ||
      Object.hasOwn(patch, "durationFrames")
    ) {
      const timingError = validateTimelineTiming(
        project,
        updated.startFrame,
        updated.durationFrames,
        "effect"
      );
      if (timingError) return failure(timingError);
    }
    if (sameEffect(source, updated)) {
      return noChange(project, effectId, "Edit cinematic effect");
    }
    return mutation(
      project,
      replaceEffect(effects, effectId, updated),
      effectId,
      "Edit cinematic effect"
    );
  }

  if (command.type === "move") {
    const timingError = validateTimelineTiming(
      project,
      command.startFrame,
      source.durationFrames,
      "command"
    );
    if (timingError) return failure(timingError);
    if (command.startFrame === source.startFrame) {
      return noChange(project, effectId, "Move cinematic effect");
    }
    return mutation(
      project,
      replaceEffect(effects, effectId, {
        ...source,
        startFrame: normalizeNumber(command.startFrame as number)
      }),
      effectId,
      "Move cinematic effect"
    );
  }

  if (command.type === "trim-start") {
    const startFrameValue = command.startFrame;
    if (
      typeof startFrameValue !== "number" ||
      !Number.isSafeInteger(startFrameValue) ||
      startFrameValue < 0
    ) {
      return failure(
        issue(
          "EFFECT_TIMELINE_START_FRAME_INVALID",
          "Trim start frame must be a non-negative safe integer.",
          "command.startFrame"
        )
      );
    }
    const startFrame = startFrameValue;
    const inclusiveEnd = source.startFrame + source.durationFrames;
    const durationFrames = inclusiveEnd - startFrame;
    const timingError = validateTimelineTiming(
      project,
      startFrame,
      durationFrames,
      "command"
    );
    if (timingError) return failure(timingError);
    if (startFrame === source.startFrame) {
      return noChange(project, effectId, "Trim cinematic effect start");
    }
    return mutation(
      project,
      replaceEffect(effects, effectId, {
        ...source,
        startFrame,
        durationFrames
      }),
      effectId,
      "Trim cinematic effect start"
    );
  }

  if (command.type === "trim-end") {
    const endFrameValue = command.endFrame;
    if (
      typeof endFrameValue !== "number" ||
      !Number.isSafeInteger(endFrameValue) ||
      endFrameValue < 0
    ) {
      return failure(
        issue(
          "EFFECT_TIMELINE_END_FRAME_INVALID",
          "Trim end frame must be a non-negative safe integer.",
          "command.endFrame"
        )
      );
    }
    const endFrame = endFrameValue;
    const durationFrames = endFrame - source.startFrame;
    const timingError = validateTimelineTiming(
      project,
      source.startFrame,
      durationFrames,
      "command"
    );
    if (timingError) return failure(timingError);
    if (durationFrames === source.durationFrames) {
      return noChange(project, effectId, "Trim cinematic effect end");
    }
    return mutation(
      project,
      replaceEffect(effects, effectId, { ...source, durationFrames }),
      effectId,
      "Trim cinematic effect end"
    );
  }

  if (command.type === "duplicate") {
    const idError = validateNewId(effects, command.newEffectId);
    if (idError) return failure(idError);
    const timingError = validateTimelineTiming(
      project,
      command.startFrame,
      source.durationFrames,
      "command"
    );
    if (timingError) return failure(timingError);
    const duplicate = {
      ...cloneEffect(source),
      id: command.newEffectId as string,
      name: `${source.name} Copy`,
      startFrame: normalizeNumber(command.startFrame as number)
    };
    const duplicateError = validateEffect(duplicate, "effect");
    if (duplicateError) return failure(duplicateError);
    const instances = [...effects];
    instances.splice(index + 1, 0, duplicate);
    return mutation(
      project,
      instances,
      duplicate.id,
      "Duplicate cinematic effect"
    );
  }

  if (command.type === "set-enabled") {
    if (typeof command.enabled !== "boolean") {
      return failure(
        issue(
          "EFFECT_TIMELINE_ENABLED_INVALID",
          "Effect enabled state must be a boolean.",
          "command.enabled"
        )
      );
    }
    if (source.enabled === command.enabled) {
      return noChange(project, effectId, "Toggle cinematic effect");
    }
    return mutation(
      project,
      replaceEffect(effects, effectId, {
        ...source,
        enabled: command.enabled
      }),
      effectId,
      command.enabled ? "Enable cinematic effect" : "Disable cinematic effect"
    );
  }

  if (command.type === "reorder") {
    const toIndexValue = command.toIndex;
    if (
      typeof toIndexValue !== "number" ||
      !Number.isSafeInteger(toIndexValue) ||
      toIndexValue < 0 ||
      toIndexValue >= effects.length
    ) {
      return failure(
        issue(
          "EFFECT_TIMELINE_ORDER_INVALID",
          "Effect priority index is outside the effect array.",
          "command.toIndex"
        )
      );
    }
    const toIndex = toIndexValue;
    if (toIndex === index) {
      return noChange(project, effectId, "Change cinematic effect priority");
    }
    const instances = [...effects];
    const [moved] = instances.splice(index, 1);
    instances.splice(toIndex, 0, moved);
    return mutation(
      project,
      instances,
      effectId,
      "Change cinematic effect priority"
    );
  }

  if (command.type === "delete") {
    return mutation(
      project,
      effects.filter((effect) => effect.id !== effectId),
      null,
      "Delete cinematic effect"
    );
  }

  return failure(
    issue(
      "EFFECT_TIMELINE_COMMAND_INVALID",
      `Unknown effect timeline command: ${command.type}.`,
      "command.type"
    )
  );
}
