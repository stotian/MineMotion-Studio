import { VFX_PRIMITIVE_VERSION, type VfxPrimitiveDescriptor } from "../primitives/VfxPrimitiveTypes";
import type { VfxActiveFrameEvaluation } from "../runtime/VfxFrameEvaluator";
import { VFX_PRESET_RECIPE_VERSION, type VfxPresetRecipe } from "./VfxPresetRecipeTypes";

export const SCREEN_VFX_RECIPE_IDS = Object.freeze([
  "nativeScreenFlash", "nativeScreenShake", "screenGlitch", "cinematicFrameBars",
  "screenBloom", "nativeVignette", "cinematicFreeze", "colorDrain"
] as const);

function recipe(id: (typeof SCREEN_VFX_RECIPE_IDS)[number]): VfxPresetRecipe {
  return Object.freeze({
    version: VFX_PRESET_RECIPE_VERSION,
    id,
    definitionId: id,
    buildDescriptors: (frame: VfxActiveFrameEvaluation): readonly VfxPrimitiveDescriptor[] => [{
      version: VFX_PRIMITIVE_VERSION,
      id: `${id}-compositor-signal`,
      kind: "light-pulse",
      color: typeof frame.inputs.parameters.color === "string" ? frame.inputs.parameters.color : "#ffffff",
      center: [0, 0, 0],
      startRadius: 0,
      endRadius: 0.01,
      baseIntensity: 0,
      peakIntensity: typeof frame.inputs.parameters.intensity === "number" ? frame.inputs.parameters.intensity : 1
    }]
  });
}

const RECIPES = Object.freeze(SCREEN_VFX_RECIPE_IDS.map(recipe));

export function listScreenVfxRecipes(): readonly VfxPresetRecipe[] {
  return RECIPES;
}
