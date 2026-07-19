import {
  invalidResult,
  validResult,
  type ValidationIssue,
  type ValidationResult
} from "../core/serialization/ValidationResult";
import type { MineMotionProject } from "../project/ProjectFile";
import { sanitizeTimelineTracks } from "../project/TimelineTrackSanitizer";
import { createLegacyVfxSeed } from "../vfx/compat/LegacyEffectAdapter";
import {
  synchronizeLegacyEffectNativeVfx,
  synchronizeValidatedLegacyEffectNativeVfx
} from "../vfx/serialization/VfxProjectMigration";
import {
  effectTimelineIssue as issue,
  isEffectTimelineRecord as isRecord,
  validateEffectTimelineNewId as validateNewId,
  validateEffectTimelinePatch as validatePatch,
  validateEffectTimelineTargetId as validateTargetId
} from "./EffectTimelineInputValidation";
import {
  validateEffectTimelineEffect as validateEffect,
  validateEffectTimelineKnownParameterPatch as validateKnownParameterPatch,
  validateEffectTimelineProject as validateProjectEffects,
  validateEffectTimelineTiming as validateTimelineTiming
} from "./EffectTimelineProjectValidation";
import type {
  EffectInstance,
  EffectParameters
} from "./EffectTypes";
import { MAX_EFFECT_INSTANCES } from "./EffectTypes";
import { syncEffectTimelineLane } from "./EffectTimelineTrack";

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

function normalizeNumber(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function failure<T>(error: ValidationIssue): ValidationResult<T> {
  return invalidResult([error]);
}

function cloneEffect(effect: EffectInstance): EffectInstance {
  const legacy: EffectInstance = {
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
  return synchronizeLegacyEffectNativeVfx(legacy, effect.nativeVfx);
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
  const synchronizedInstances = instances.map((effect) =>
    synchronizeValidatedLegacyEffectNativeVfx(effect, effect.nativeVfx)
  );
  return validResult({
    project: syncEffectTimelineLane({
      ...project,
      animation: { ...project.animation, timelineTracks },
      effects: { instances: synchronizedInstances }
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
    const pastedBase = {
      ...cloneEffect(source),
      id: command.newEffectId as string,
      name: `${source.name} Copy`,
      startFrame: normalizeNumber(command.startFrame as number)
    };
    const pasted = synchronizeLegacyEffectNativeVfx(
      pastedBase,
      pastedBase.nativeVfx
        ? {
            ...pastedBase.nativeVfx,
            seed: createLegacyVfxSeed(pastedBase.id, pastedBase.type)
          }
        : undefined
    );
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
    const updatedError = validateEffect(
      updated,
      "effect",
      patch.parameters === undefined
    );
    if (updatedError) return failure(updatedError);
    if (patch.parameters !== undefined) {
      const parameterPatchError = validateKnownParameterPatch(
        source,
        patch.parameters
      );
      if (parameterPatchError) return failure(parameterPatchError);
    }
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
    const duplicateBase = {
      ...cloneEffect(source),
      id: command.newEffectId as string,
      name: `${source.name} Copy`,
      startFrame: normalizeNumber(command.startFrame as number)
    };
    const duplicate = synchronizeLegacyEffectNativeVfx(
      duplicateBase,
      duplicateBase.nativeVfx
        ? {
            ...duplicateBase.nativeVfx,
            seed: createLegacyVfxSeed(duplicateBase.id, duplicateBase.type)
          }
        : undefined
    );
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
