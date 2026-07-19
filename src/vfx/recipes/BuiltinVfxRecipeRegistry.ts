import { listCombatVfxRecipes } from "./CombatVfxRecipes";
import { listElectricVfxRecipes } from "./ElectricVfxRecipes";
import { listFireVfxRecipes } from "./FireVfxRecipes";
import { listMagicVfxRecipes } from "./MagicVfxRecipes";
import { listEnvironmentVfxRecipes } from "./EnvironmentVfxRecipes";
import { listScreenVfxRecipes } from "./ScreenVfxRecipes";
import { listMovementVfxRecipes } from "./MovementVfxRecipes";
import type { VfxPresetRecipe } from "./VfxPresetRecipeTypes";

const RECIPES = Object.freeze([
  ...listCombatVfxRecipes(),
  ...listElectricVfxRecipes(),
  ...listFireVfxRecipes(),
  ...listMagicVfxRecipes(),
  ...listEnvironmentVfxRecipes(),
  ...listScreenVfxRecipes(),
  ...listMovementVfxRecipes()
]);
const BY_ID = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

if (BY_ID.size !== RECIPES.length) {
  throw new RangeError("Built-in VFX recipe IDs must be unique.");
}

export function getBuiltinVfxRecipe(definitionId: string): VfxPresetRecipe | null {
  return BY_ID.get(definitionId) ?? null;
}

export function listBuiltinVfxRecipes(): readonly VfxPresetRecipe[] {
  return RECIPES;
}
