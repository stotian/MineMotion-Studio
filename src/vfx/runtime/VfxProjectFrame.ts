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
import { createLegacyVfxRegistry } from "../compat/LegacyEffectAdapter";
import type { VfxQuality } from "../core/VfxEvaluationContext";
import { synchronizeLegacyEffectNativeVfx } from "../serialization/VfxProjectMigration";
import {
  evaluateVfxFrame,
  type VfxActiveFrameEvaluation
} from "./VfxFrameEvaluator";

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
}

export interface PreparedProjectVfxFrame {
  frame: number;
  fps: number;
  included: boolean;
  effects: PreparedProjectVfxEffect[];
}

export type PreparedProjectVfxFrameResult =
  ValidationResult<PreparedProjectVfxFrame>;

export const DEFAULT_PROJECT_VFX_CONTEXT_SEED =
  "minemotion-project-vfx-runtime-v1";

const legacyVfxRegistry = createLegacyVfxRegistry();

export function shouldIncludeProjectVfx(project: MineMotionProject): boolean {
  return (
    !project.renderSettings.renderPreviewEnabled ||
    project.exportSettings.includeVfx
  );
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

export function prepareProjectVfxFrame(
  project: MineMotionProject,
  options: PrepareProjectVfxFrameOptions
): PreparedProjectVfxFrameResult {
  const frame = options.frame ?? project.animation.currentFrame;
  const fps = options.fps ?? project.animation.fps;
  if (!options.includeVfx) {
    return validResult({ frame, fps, included: false, effects: [] });
  }

  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const effects: PreparedProjectVfxEffect[] = [];
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
      effects.push({
        type: effect.type,
        displayName: synchronized.nativeVfx.displayName,
        evaluation: evaluation.value,
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

  return errors.length > 0
    ? invalidResult(errors, warnings)
    : validResult({ frame, fps, included: true, effects }, warnings);
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
  const shake = effects.find((effect) => effect.type === "cameraShake");
  if (!shake) return { x: 0, y: 0 };
  const strength =
    getPreparedVfxNumber(shake, "strength", 0.7) *
    (1 - shake.evaluation.progress);
  const frequency = getPreparedVfxNumber(shake, "frequency", 18);
  return {
    x: Math.sin(shake.evaluation.frame * frequency * 0.13) * strength * 8,
    y: Math.cos(shake.evaluation.frame * frequency * 0.11) * strength * 6
  };
}
