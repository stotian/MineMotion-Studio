import {
  deriveSeed,
  randomFloat01
} from "../../core/random/DeterministicRandom";
import type { TransformData } from "../../core/scene/SceneTypes";
import {
  invalidResult,
  validResult,
  type ValidationIssue,
  type ValidationResult
} from "../../core/serialization/ValidationResult";
import type {
  VfxBlendMode,
  VfxDefinition,
  VfxRenderLayer,
  VfxSpace
} from "../core/VfxDefinition";
import type {
  VfxEvaluationContext,
  VfxQuality
} from "../core/VfxEvaluationContext";
import type { VfxInstance, VfxTarget } from "../core/VfxInstance";
import type { VfxParameterValue } from "../core/VfxParameter";
import { getVfxParameterDefault } from "../core/VfxParameterSchema";
import {
  validateVfxDefinition,
  validateVfxInstance
} from "../core/VfxValidator";

export type VfxInactiveReason = "disabled" | "before-start" | "after-end";

export interface VfxPrimitiveFrameInputs {
  space: VfxSpace;
  transform: TransformData;
  target: VfxTarget | null;
  parameters: Readonly<Record<string, VfxParameterValue>>;
  blendMode: VfxBlendMode;
  renderLayer: VfxRenderLayer;
}

export interface VfxInactiveFrameEvaluation {
  status: "inactive";
  reason: VfxInactiveReason;
  instanceId: string;
  definitionId: string;
  frame: number;
}

export interface VfxActiveFrameEvaluation {
  status: "active";
  instanceId: string;
  definitionId: string;
  frame: number;
  fps: number;
  localFrame: number;
  progress: number;
  localSeconds: number;
  durationSeconds: number;
  rootSeed: number;
  frameSeed: number;
  frameRandom: number;
  quality: VfxQuality;
  qualityScale: number;
  inputs: VfxPrimitiveFrameInputs;
}

export type VfxFrameEvaluation =
  | VfxInactiveFrameEvaluation
  | VfxActiveFrameEvaluation;

export type VfxFrameEvaluationResult = ValidationResult<VfxFrameEvaluation>;

export const VFX_QUALITY_SCALES: Readonly<Record<VfxQuality, number>> =
  Object.freeze({
    draft: 0.25,
    medium: 0.5,
    high: 0.75,
    final: 1
  });

const VFX_QUALITIES = new Set<VfxQuality>([
  "draft",
  "medium",
  "high",
  "final"
]);

function issue(code: string, message: string, path: string): ValidationIssue {
  return { code, message, path, severity: "error" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareIssues(left: ValidationIssue, right: ValidationIssue): number {
  return (
    compareText(left.severity, right.severity) ||
    compareText(left.code, right.code) ||
    compareText(left.path ?? "", right.path ?? "") ||
    compareText(left.message, right.message)
  );
}

function sortedIssues(issues: readonly ValidationIssue[]): ValidationIssue[] {
  return [...issues].sort(compareIssues);
}

function validateContext(context: VfxEvaluationContext): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  if (!Number.isSafeInteger(context.frame) || context.frame < 0) {
    errors.push(
      issue(
        "VFX_CONTEXT_FRAME_INVALID",
        "VFX evaluation frame must be a non-negative safe integer.",
        "context.frame"
      )
    );
  }
  if (!Number.isFinite(context.fps) || context.fps <= 0) {
    errors.push(
      issue(
        "VFX_CONTEXT_FPS_INVALID",
        "VFX evaluation FPS must be finite and positive.",
        "context.fps"
      )
    );
  }
  if (typeof context.seed !== "string" || context.seed.trim() === "") {
    errors.push(
      issue(
        "VFX_CONTEXT_SEED_REQUIRED",
        "VFX evaluation context seed is required.",
        "context.seed"
      )
    );
  }
  if (!VFX_QUALITIES.has(context.quality)) {
    errors.push(
      issue(
        "VFX_CONTEXT_QUALITY_INVALID",
        "VFX evaluation quality is invalid.",
        "context.quality"
      )
    );
  }
  return errors;
}

function normalizeNumber(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function cloneTransform(transform: TransformData): TransformData {
  return {
    position: transform.position.map(normalizeNumber) as TransformData["position"],
    rotation: transform.rotation.map(normalizeNumber) as TransformData["rotation"],
    scale: transform.scale.map(normalizeNumber) as TransformData["scale"]
  };
}

function cloneTarget(target: VfxTarget | null): VfxTarget | null {
  if (!target) return null;
  return target.boneId === undefined
    ? { entityId: target.entityId }
    : { entityId: target.entityId, boneId: target.boneId };
}

function normalizeParameterValue(value: VfxParameterValue): VfxParameterValue {
  return typeof value === "number" ? normalizeNumber(value) : value;
}

function resolveParameters(
  instance: VfxInstance,
  definition: VfxDefinition
): Record<string, VfxParameterValue> {
  const values = new Map<string, VfxParameterValue>();
  for (const parameter of definition.parameterSchema) {
    values.set(
      parameter.id,
      normalizeParameterValue(getVfxParameterDefault(parameter))
    );
  }
  for (const [parameterId, value] of Object.entries(instance.parameters)) {
    values.set(parameterId, normalizeParameterValue(value));
  }
  return Object.fromEntries(
    [...values.entries()].sort(([left], [right]) => compareText(left, right))
  );
}

function inactiveEvaluation(
  reason: VfxInactiveReason,
  instance: VfxInstance,
  frame: number
): VfxInactiveFrameEvaluation {
  return {
    status: "inactive",
    reason,
    instanceId: instance.id,
    definitionId: instance.definitionId,
    frame: normalizeNumber(frame)
  };
}

/**
 * Evaluates one VFX frame without reading or retaining runtime state.
 *
 * The random stream is based on local effect time so moving an instance on the
 * timeline preserves its internal pattern. FPS and quality are deliberately
 * excluded from the seed, allowing callers to change timing units or consume a
 * longer quality prefix without reshuffling existing samples.
 */
export function evaluateVfxFrame(
  instance: VfxInstance,
  definition: VfxDefinition | null,
  context: VfxEvaluationContext
): VfxFrameEvaluationResult {
  if (!isRecord(context)) {
    return invalidResult([
      issue(
        "VFX_CONTEXT_INVALID",
        "VFX evaluation context must be an object.",
        "context"
      )
    ]);
  }
  if (!isRecord(instance)) {
    return invalidResult([
      issue("VFX_INSTANCE_INVALID", "VFX instance must be an object.", "instance")
    ]);
  }
  if (definition !== null && !isRecord(definition)) {
    return invalidResult([
      issue(
        "VFX_DEFINITION_INVALID",
        "VFX definition must be an object or null.",
        "definition"
      )
    ]);
  }

  const contextErrors = validateContext(context);
  const definitionValidation = definition
    ? validateVfxDefinition(definition)
    : null;
  if (definitionValidation && !definitionValidation.ok) {
    return invalidResult(
      sortedIssues([...contextErrors, ...definitionValidation.errors]),
      sortedIssues(definitionValidation.warnings)
    );
  }

  const instanceValidation = validateVfxInstance(instance, definition);
  const warnings = sortedIssues([
    ...(definitionValidation?.warnings ?? []),
    ...instanceValidation.warnings
  ]);
  if (!instanceValidation.ok || contextErrors.length > 0) {
    return invalidResult(
      sortedIssues([
        ...contextErrors,
        ...(instanceValidation.ok ? [] : instanceValidation.errors)
      ]),
      warnings
    );
  }

  if (!definition) {
    // validateVfxInstance reports a missing definition, so this is unreachable.
    return invalidResult(
      [
        issue(
          "VFX_DEFINITION_NOT_FOUND",
          `VFX definition was not found: ${instance.definitionId}`,
          "definitionId"
        )
      ],
      warnings
    );
  }

  const durationSeconds = instance.durationFrames / context.fps;
  if (!Number.isFinite(durationSeconds)) {
    return invalidResult(
      [
        issue(
          "VFX_CONTEXT_FPS_INVALID",
          "VFX evaluation FPS is too small to produce finite timing values.",
          "context.fps"
        )
      ],
      warnings
    );
  }

  const frame = normalizeNumber(context.frame);
  if (!instance.enabled) {
    return validResult(inactiveEvaluation("disabled", instance, frame), warnings);
  }
  if (frame < instance.startFrame) {
    return validResult(
      inactiveEvaluation("before-start", instance, frame),
      warnings
    );
  }
  if (frame > instance.startFrame + instance.durationFrames) {
    return validResult(inactiveEvaluation("after-end", instance, frame), warnings);
  }

  const localFrame = normalizeNumber(frame - instance.startFrame);
  const progress = normalizeNumber(localFrame / instance.durationFrames);
  const localSeconds = normalizeNumber(localFrame / context.fps);
  const rootSeed = deriveSeed(
    "vfx-frame-evaluation",
    context.seed,
    instance.seed,
    definition.id
  );
  const frameSeed = deriveSeed("vfx-local-frame", rootSeed, localFrame);

  return validResult(
    {
      status: "active",
      instanceId: instance.id,
      definitionId: instance.definitionId,
      frame,
      fps: normalizeNumber(context.fps),
      localFrame,
      progress,
      localSeconds,
      durationSeconds: normalizeNumber(durationSeconds),
      rootSeed,
      frameSeed,
      frameRandom: randomFloat01(frameSeed, 0),
      quality: context.quality,
      qualityScale: VFX_QUALITY_SCALES[context.quality],
      inputs: {
        space: instance.space,
        transform: cloneTransform(instance.transform),
        target: cloneTarget(instance.target),
        parameters: resolveParameters(instance, definition),
        blendMode: instance.blendMode,
        renderLayer: instance.renderLayer
      }
    },
    warnings
  );
}
