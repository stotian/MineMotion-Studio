import type { TransformData } from "../../core/scene/SceneTypes";
import {
  invalidResult,
  validResult,
  type ValidationIssue,
  type ValidationResult
} from "../../core/serialization/ValidationResult";
import { effectRegistry } from "../../effects/EffectRegistry";
import type { EffectType } from "../../effects/EffectTypes";
import type { MineMotionProject, SceneEntity } from "../../project/ProjectFile";
import { findObject } from "../../project/ProjectStore";
import { getRigDefinition } from "../../rigs/MinecraftRigPresets";
import { createProjectVfxRegistry } from "../compat/LegacyEffectAdapter";
import type { VfxQuality } from "../core/VfxEvaluationContext";
import { synchronizeLegacyEffectNativeVfx } from "../serialization/VfxProjectMigration";
import type { VfxPrimitiveEvaluation } from "../primitives/VfxPrimitiveTypes";
import { getBuiltinVfxRecipe } from "../recipes/BuiltinVfxRecipeRegistry";
import {
  evaluatePreparedVfxPresetRecipe,
  prepareVfxPresetRecipe
} from "../recipes/VfxPresetRecipeEvaluator";
import { VFX_PRESET_RECIPE_VERSION, type VfxPresetRecipe } from "../recipes/VfxPresetRecipeTypes";
import {
  evaluateVfxFrame,
  type VfxActiveFrameEvaluation
} from "./VfxFrameEvaluator";
import {
  createEmptyVfxFrameBudgetSummary,
  measureLegacyVfxEffectWork,
  requestVfxEffectBudget,
  type VfxEffectBudgetAllocation,
  type VfxFrameBudgetSummary
} from "./VfxFrameBudget";

export type VfxFrameQualitySource = "preview" | "export" | VfxQuality;

export interface PrepareProjectVfxFrameOptions {
  frame?: number;
  fps?: number;
  includeVfx: boolean;
  quality: VfxFrameQualitySource;
  contextSeed?: string;
}

export interface ResolvedVfxTarget {
  entityId: string;
  entityType: SceneEntity["type"];
  boneId?: string;
  transform: TransformData;
}

export interface PreparedProjectVfxEffect {
  type: EffectType;
  displayName: string;
  evaluation: VfxActiveFrameEvaluation;
  resolvedTarget: ResolvedVfxTarget | null;
  budget: VfxEffectBudgetAllocation;
  primitives: readonly VfxPrimitiveEvaluation[];
}

export interface PreparedProjectVfxFrame {
  frame: number;
  fps: number;
  included: boolean;
  effects: PreparedProjectVfxEffect[];
  budget: VfxFrameBudgetSummary;
}

export type PreparedProjectVfxFrameResult =
  ValidationResult<PreparedProjectVfxFrame>;

export const DEFAULT_PROJECT_VFX_CONTEXT_SEED =
  "minemotion-project-vfx-runtime-v1";

const legacyVfxRegistry = createProjectVfxRegistry();

export function shouldIncludeProjectVfx(project: MineMotionProject): boolean {
  return (
    !project.renderSettings.renderPreviewEnabled ||
    project.exportSettings.includeVfx
  );
}

export function resolveVfxAnimationSampleFrame(
  project: MineMotionProject,
  frame = project.animation.currentFrame
): number {
  if (!shouldIncludeProjectVfx(project)) return frame;
  let sampleFrame = frame;
  for (const effect of project.effects.instances) {
    if (
      (effect.type === "hitStop" || effect.type === "cinematicFreeze") &&
      effect.enabled &&
      frame >= effect.startFrame &&
      frame <= effect.startFrame + effect.durationFrames
    ) {
      sampleFrame = Math.min(sampleFrame, effect.startFrame);
    }
  }
  return sampleFrame;
}

function issue(
  code: string,
  message: string,
  path: string,
  severity: ValidationIssue["severity"] = "error"
): ValidationIssue {
  return { code, message, path, severity };
}

function cloneTransform(transform: TransformData): TransformData {
  return {
    position: [...transform.position],
    rotation: [...transform.rotation],
    scale: [...transform.scale]
  };
}

function resolveTarget(
  project: MineMotionProject,
  target: VfxActiveFrameEvaluation["inputs"]["target"],
  path: string,
  warnings: ValidationIssue[]
): ResolvedVfxTarget | null {
  if (!target) return null;
  const lookup = findObject(project, target.entityId);
  if (!lookup) {
    warnings.push(
      issue(
        "VFX_TARGET_ENTITY_MISSING",
        `VFX target entity was not found: ${target.entityId}.`,
        `${path}.entityId`,
        "warning"
      )
    );
    return null;
  }

  if (target.boneId !== undefined) {
    if (lookup.entity.type !== "character") {
      warnings.push(
        issue(
          "VFX_TARGET_BONE_UNSUPPORTED",
          `VFX target bone requires a character entity: ${target.boneId}.`,
          `${path}.boneId`,
          "warning"
        )
      );
      return null;
    }
    const character = project.scene.characters.find(
      (candidate) => candidate.id === lookup.entity.id
    );
    if (!character) {
      warnings.push(
        issue(
          "VFX_TARGET_CHARACTER_MISSING",
          `VFX target character data was not found: ${target.entityId}.`,
          `${path}.entityId`,
          "warning"
        )
      );
      return null;
    }
    const rig = getRigDefinition(character.rigPreset);
    if (!rig.bones.some((bone) => bone.id === target.boneId)) {
      warnings.push(
        issue(
          "VFX_TARGET_BONE_MISSING",
          `VFX target bone was not found: ${target.boneId}.`,
          `${path}.boneId`,
          "warning"
        )
      );
      return null;
    }
  }

  return {
    entityId: lookup.entity.id,
    entityType: lookup.entity.type,
    ...(target.boneId === undefined ? {} : { boneId: target.boneId }),
    transform: cloneTransform(lookup.entity.transform)
  };
}

function resolveQuality(
  source: VfxFrameQualitySource,
  previewQuality: VfxQuality,
  exportQuality: VfxQuality
): VfxQuality {
  if (source === "preview") return previewQuality;
  if (source === "export") return exportQuality;
  return source;
}

function customRecipeForInstance(
  instance: ReturnType<typeof synchronizeLegacyEffectNativeVfx>["nativeVfx"]
): VfxPresetRecipe | null {
  if (!instance.customRecipe) return null;
  const descriptors = instance.customRecipe.descriptors;
  return {
    version: VFX_PRESET_RECIPE_VERSION,
    id: instance.id,
    definitionId: instance.definitionId,
    buildDescriptors: () => descriptors
  };
}

export function prepareProjectVfxFrame(
  project: MineMotionProject,
  options: PrepareProjectVfxFrameOptions
): PreparedProjectVfxFrameResult {
  const frame = options.frame ?? project.animation.currentFrame;
  const fps = options.fps ?? project.animation.fps;
  if (!options.includeVfx) {
    return validResult({
      frame,
      fps,
      included: false,
      effects: [],
      budget: createEmptyVfxFrameBudgetSummary()
    });
  }

  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const effects: PreparedProjectVfxEffect[] = [];
  const budget = createEmptyVfxFrameBudgetSummary();
  for (let index = 0; index < project.effects.instances.length; index += 1) {
    const effect = project.effects.instances[index];
    const path = `effects.instances.${index}`;
    try {
      const synchronized = synchronizeLegacyEffectNativeVfx(
        effect,
        effect.nativeVfx
      );
      const definition = legacyVfxRegistry.get(
        synchronized.nativeVfx.definitionId
      );
      const evaluation = evaluateVfxFrame(synchronized.nativeVfx, definition, {
        frame,
        fps,
        seed: options.contextSeed ?? DEFAULT_PROJECT_VFX_CONTEXT_SEED,
        quality: resolveQuality(
          options.quality,
          synchronized.nativeVfx.previewQuality,
          synchronized.nativeVfx.exportQuality
        )
      });
      warnings.push(
        ...evaluation.warnings.map((warning) => ({
          ...warning,
          path: `${path}.nativeVfx.${warning.path ?? ""}`.replace(/\.$/, "")
        }))
      );
      if (!evaluation.ok) {
        errors.push(
          ...evaluation.errors.map((error) => ({
            ...error,
            path: `${path}.nativeVfx.${error.path ?? ""}`.replace(/\.$/, "")
          }))
        );
        continue;
      }
      if (evaluation.value.status === "inactive") continue;
      if (!effectRegistry.get(effect.type)) {
        errors.push(
          issue(
            "VFX_LEGACY_VISUAL_UNSUPPORTED",
            `No compatibility visual is registered for ${effect.type}.`,
            `${path}.type`
          )
        );
        continue;
      }
      const recipe =
        customRecipeForInstance(synchronized.nativeVfx) ??
        getBuiltinVfxRecipe(evaluation.value.definitionId);
      const preparedRecipe = recipe
        ? prepareVfxPresetRecipe(evaluation.value, recipe)
        : null;
      if (preparedRecipe && !preparedRecipe.ok) {
        errors.push(
          ...preparedRecipe.errors.map((error) => ({
            ...error,
            path: `${path}.nativeVfx.recipe.${error.path ?? ""}`.replace(/\.$/, "")
          }))
        );
        warnings.push(...preparedRecipe.warnings);
        continue;
      }
      const work = preparedRecipe?.ok
        ? preparedRecipe.value.work
        : measureLegacyVfxEffectWork(
            effect.type,
            getEvaluationNumber(evaluation.value, "count", 18)
          );
      const allocation = requestVfxEffectBudget(budget, work);
      if (!allocation) continue;
      const evaluatedRecipe = preparedRecipe?.ok
        ? evaluatePreparedVfxPresetRecipe(
            evaluation.value,
            preparedRecipe.value,
            allocation
          )
        : null;
      if (evaluatedRecipe && !evaluatedRecipe.ok) {
        errors.push(
          ...evaluatedRecipe.errors.map((error) => ({
            ...error,
            path: `${path}.nativeVfx.recipe.${error.path ?? ""}`.replace(/\.$/, "")
          }))
        );
        warnings.push(...evaluatedRecipe.warnings);
        continue;
      }
      if (evaluatedRecipe?.ok) warnings.push(...evaluatedRecipe.warnings);
      effects.push({
        type: effect.type,
        displayName: synchronized.nativeVfx.displayName,
        evaluation: evaluation.value,
        budget: allocation,
        primitives: evaluatedRecipe?.ok ? evaluatedRecipe.value.primitives : [],
        resolvedTarget: resolveTarget(
          project,
          evaluation.value.inputs.target,
          `${path}.nativeVfx.target`,
          warnings
        )
      });
    } catch (error) {
      errors.push(
        issue(
          "VFX_PROJECT_PREPARATION_FAILED",
          error instanceof Error ? error.message : "VFX preparation failed.",
          path
        )
      );
    }
  }

  appendBudgetWarnings(budget, warnings);

  return errors.length > 0
    ? invalidResult(errors, warnings)
    : validResult({ frame, fps, included: true, effects, budget }, warnings);
}

function getEvaluationNumber(
  evaluation: VfxActiveFrameEvaluation,
  parameterId: string,
  fallback: number
): number {
  const value = evaluation.inputs.parameters[parameterId];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function appendBudgetWarnings(
  budget: VfxFrameBudgetSummary,
  warnings: ValidationIssue[]
): void {
  const dimensions = ["effects", "particles", "segments", "stackWork"] as const;
  for (const dimension of dimensions) {
    if (budget.limitHits[dimension] === 0) continue;
    warnings.push(
      issue(
        `VFX_GLOBAL_${dimension.replace(/([A-Z])/g, "_$1").toUpperCase()}_BUDGET_CAPPED`,
        `Global VFX ${dimension} budget was reached; ${budget.requested[dimension]} units were requested and ${budget.allocated[dimension]} were allocated.`,
        "effects.instances",
        "warning"
      )
    );
  }
}

export function getPreparedVfxNumber(
  effect: PreparedProjectVfxEffect,
  parameterId: string,
  fallback: number
): number {
  const value = effect.evaluation.inputs.parameters[parameterId];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function getPreparedVfxString(
  effect: PreparedProjectVfxEffect,
  parameterId: string,
  fallback: string
): string {
  const value = effect.evaluation.inputs.parameters[parameterId];
  return typeof value === "string" ? value : fallback;
}

export function getPreparedCameraShakeOffset(
  effects: readonly PreparedProjectVfxEffect[]
): { x: number; y: number } {
  const shake = effects.find(
    (effect) =>
      effect.type === "cameraShake" || effect.type === "nativeScreenShake"
  );
  if (!shake) return { x: 0, y: 0 };
  const envelope =
    shake.type === "nativeScreenShake"
      ? Math.pow(
          1 - shake.evaluation.progress,
          Math.max(0.01, getPreparedVfxNumber(shake, "decay", 0.8))
        ) * getPreparedVfxNumber(shake, "intensity", 1)
      : 1 - shake.evaluation.progress;
  const strength = getPreparedVfxNumber(shake, "strength", 0.7) * envelope;
  const frequency = getPreparedVfxNumber(shake, "frequency", 18);
  return {
    x: Math.sin(shake.evaluation.frame * frequency * 0.13) * strength * 8,
    y: Math.cos(shake.evaluation.frame * frequency * 0.11) * strength * 6
  };
}
