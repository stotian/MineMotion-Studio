import type { ValidationIssue, ValidationResult } from "../../core/serialization/ValidationResult";
import type { VfxPrimitiveDescriptor, VfxPrimitiveEvaluation } from "../primitives/VfxPrimitiveTypes";
import type { VfxEffectBudgetAllocation, VfxEffectWorkRequest } from "../runtime/VfxFrameBudget";
import type { VfxActiveFrameEvaluation } from "../runtime/VfxFrameEvaluator";

export const VFX_PRESET_RECIPE_VERSION = 1 as const;
export const MAX_VFX_RECIPE_PRIMITIVES = 16;

export interface VfxPresetRecipe {
  version: typeof VFX_PRESET_RECIPE_VERSION;
  id: string;
  definitionId: string;
  buildDescriptors(frame: VfxActiveFrameEvaluation): readonly VfxPrimitiveDescriptor[];
}

export interface PreparedVfxPresetRecipe {
  recipeId: string;
  definitionId: string;
  descriptors: readonly VfxPrimitiveDescriptor[];
  work: VfxEffectWorkRequest;
  warnings: readonly ValidationIssue[];
}

export interface EvaluatedVfxPresetRecipe {
  recipeId: string;
  definitionId: string;
  primitives: readonly VfxPrimitiveEvaluation[];
  budget: VfxEffectBudgetAllocation;
}

export type PreparedVfxPresetRecipeResult = ValidationResult<PreparedVfxPresetRecipe>;
export type EvaluatedVfxPresetRecipeResult = ValidationResult<EvaluatedVfxPresetRecipe>;
