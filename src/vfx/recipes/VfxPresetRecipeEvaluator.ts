import {
  invalidResult,
  validResult,
  type ValidationIssue
} from "../../core/serialization/ValidationResult";
import { evaluateVfxPrimitive } from "../primitives/VfxPrimitiveEvaluator";
import { validateVfxPrimitiveDescriptor } from "../primitives/VfxPrimitiveValidator";
import type { VfxPrimitiveDescriptor } from "../primitives/VfxPrimitiveTypes";
import { VFX_GLOBAL_FRAME_LIMITS, type VfxEffectBudgetAllocation } from "../runtime/VfxFrameBudget";
import type { VfxActiveFrameEvaluation } from "../runtime/VfxFrameEvaluator";
import {
  MAX_VFX_RECIPE_PRIMITIVES,
  VFX_PRESET_RECIPE_VERSION,
  type EvaluatedVfxPresetRecipeResult,
  type PreparedVfxPresetRecipe,
  type PreparedVfxPresetRecipeResult,
  type VfxPresetRecipe
} from "./VfxPresetRecipeTypes";

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/;

function issue(code: string, message: string, path: string): ValidationIssue {
  return { code, message, path, severity: "error" };
}

function evaluatedCount(requested: number, scale: number, minimum: number): number {
  return Math.max(minimum, Math.ceil(requested * scale));
}

function descriptorWork(
  descriptor: VfxPrimitiveDescriptor,
  qualityScale: number
): { particles: number; segments: number } {
  if (descriptor.kind === "particle-emitter") {
    return { particles: evaluatedCount(descriptor.count, qualityScale, 1), segments: 0 };
  }
  if (descriptor.kind === "beam") {
    return { particles: 0, segments: evaluatedCount(descriptor.subdivisions, qualityScale, 1) };
  }
  if (descriptor.kind === "trail") {
    return { particles: 0, segments: evaluatedCount(descriptor.segments, qualityScale, 1) };
  }
  if (descriptor.kind === "expanding-ring") {
    return { particles: 0, segments: evaluatedCount(descriptor.segments, qualityScale, 3) };
  }
  return { particles: 0, segments: 0 };
}

function freezeDescriptor(
  descriptor: VfxPrimitiveDescriptor
): VfxPrimitiveDescriptor {
  const copy = structuredClone(descriptor);
  if (copy.kind === "beam") {
    Object.freeze(copy.start);
    Object.freeze(copy.end);
  } else if (copy.kind === "trail") {
    for (const point of copy.points) Object.freeze(point);
    Object.freeze(copy.points);
  } else if (copy.kind === "expanding-ring" || copy.kind === "light-pulse") {
    Object.freeze(copy.center);
  }
  return Object.freeze(copy) as VfxPrimitiveDescriptor;
}

export function prepareVfxPresetRecipe(
  frame: VfxActiveFrameEvaluation,
  recipe: VfxPresetRecipe
): PreparedVfxPresetRecipeResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  if (recipe.version !== VFX_PRESET_RECIPE_VERSION) {
    errors.push(issue("VFX_RECIPE_VERSION_UNSUPPORTED", "VFX recipe version is unsupported.", "recipe.version"));
  }
  if (!IDENTIFIER_PATTERN.test(recipe.id) || !IDENTIFIER_PATTERN.test(recipe.definitionId)) {
    errors.push(issue("VFX_RECIPE_ID_INVALID", "VFX recipe identifiers are invalid.", "recipe.id"));
  }
  if (frame.definitionId !== recipe.definitionId) {
    errors.push(issue("VFX_RECIPE_DEFINITION_MISMATCH", "VFX recipe does not match the active definition.", "recipe.definitionId"));
  }

  let built: readonly VfxPrimitiveDescriptor[];
  try {
    built = recipe.buildDescriptors(frame);
  } catch (error) {
    errors.push(issue("VFX_RECIPE_BUILD_FAILED", error instanceof Error ? error.message : "VFX recipe construction failed.", "recipe.buildDescriptors"));
    return invalidResult(errors, warnings);
  }
  if (!Array.isArray(built) || built.length > MAX_VFX_RECIPE_PRIMITIVES) {
    errors.push(issue("VFX_RECIPE_PRIMITIVE_COUNT_INVALID", `VFX recipes support 0-${MAX_VFX_RECIPE_PRIMITIVES} primitives.`, "recipe.primitives"));
    return invalidResult(errors, warnings);
  }

  const descriptors: VfxPrimitiveDescriptor[] = [];
  const ids = new Set<string>();
  let particles = 0;
  let segments = 0;
  for (let index = 0; index < built.length; index += 1) {
    const result = validateVfxPrimitiveDescriptor(built[index]);
    warnings.push(...result.warnings.map((warning) => ({ ...warning, path: `recipe.primitives.${index}.${warning.path ?? ""}`.replace(/\.$/, "") })));
    if (!result.ok) {
      errors.push(...result.errors.map((error) => ({ ...error, path: `recipe.primitives.${index}.${error.path ?? ""}`.replace(/\.$/, "") })));
      continue;
    }
    if (ids.has(result.value.id)) {
      errors.push(issue("VFX_RECIPE_PRIMITIVE_ID_DUPLICATE", `Duplicate primitive ID: ${result.value.id}.`, `recipe.primitives.${index}.id`));
      continue;
    }
    ids.add(result.value.id);
    const frozen = freezeDescriptor(result.value);
    descriptors.push(frozen);
    const work = descriptorWork(frozen, frame.qualityScale);
    particles += work.particles;
    segments += work.segments;
  }
  const stackWork = 1 + particles + segments;
  if (
    particles > VFX_GLOBAL_FRAME_LIMITS.particles ||
    segments > VFX_GLOBAL_FRAME_LIMITS.segments ||
    stackWork > VFX_GLOBAL_FRAME_LIMITS.stackWork
  ) {
    errors.push(issue("VFX_RECIPE_GLOBAL_BUDGET_EXCEEDED", "VFX recipe exceeds the global single-frame limits.", "recipe.primitives"));
  }
  if (errors.length > 0) return invalidResult(errors, warnings);
  return validResult(
    Object.freeze({
      recipeId: recipe.id,
      definitionId: recipe.definitionId,
      descriptors: Object.freeze(descriptors),
      work: Object.freeze({ particles, segments }),
      warnings: Object.freeze([...warnings])
    }),
    warnings
  );
}

function allocateParticleCounts(
  descriptors: readonly VfxPrimitiveDescriptor[],
  allocation: VfxEffectBudgetAllocation,
  qualityScale: number
): VfxPrimitiveDescriptor[] {
  let remaining = allocation.particles;
  return descriptors.flatMap((descriptor) => {
    if (descriptor.kind !== "particle-emitter") return descriptor;
    const requested = evaluatedCount(descriptor.count, qualityScale, 1);
    const granted = Math.min(requested, remaining);
    remaining -= granted;
    if (granted === 0) return [];
    if (granted >= requested) return descriptor;
    return { ...descriptor, count: Math.max(1, Math.floor(granted / qualityScale)) };
  });
}

export function evaluatePreparedVfxPresetRecipe(
  frame: VfxActiveFrameEvaluation,
  prepared: PreparedVfxPresetRecipe,
  allocation: VfxEffectBudgetAllocation
): EvaluatedVfxPresetRecipeResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [...prepared.warnings];
  const primitives = [];
  const descriptors = allocateParticleCounts(prepared.descriptors, allocation, frame.qualityScale);
  for (let index = 0; index < descriptors.length; index += 1) {
    const result = evaluateVfxPrimitive(frame, descriptors[index]);
    warnings.push(...result.warnings.map((warning) => ({ ...warning, path: `recipe.primitives.${index}.${warning.path ?? ""}`.replace(/\.$/, "") })));
    if (!result.ok) {
      errors.push(...result.errors.map((error) => ({ ...error, path: `recipe.primitives.${index}.${error.path ?? ""}`.replace(/\.$/, "") })));
    } else {
      primitives.push(result.value);
    }
  }
  return errors.length > 0
    ? invalidResult(errors, warnings)
    : validResult(Object.freeze({ recipeId: prepared.recipeId, definitionId: prepared.definitionId, primitives: Object.freeze(primitives), budget: Object.freeze({ ...allocation }) }), warnings);
}
