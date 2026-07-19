import { describe, expect, it } from "vitest";
import type { VfxActiveFrameEvaluation } from "../runtime/VfxFrameEvaluator";
import { listBuiltinVfxRecipes } from "./BuiltinVfxRecipeRegistry";
import { evaluatePreparedVfxPresetRecipe, prepareVfxPresetRecipe } from "./VfxPresetRecipeEvaluator";
import { VFX_PRESET_RECIPE_VERSION, type VfxPresetRecipe } from "./VfxPresetRecipeTypes";

function frame(
  definitionId: string,
  quality: VfxActiveFrameEvaluation["quality"] = "final"
): VfxActiveFrameEvaluation {
  const qualityScale = { draft: 0.25, medium: 0.5, high: 0.75, final: 1 }[quality];
  return {
    status: "active",
    instanceId: `instance_${definitionId}`,
    definitionId,
    frame: 4,
    fps: 24,
    localFrame: 4,
    progress: 0.4,
    localSeconds: 4 / 24,
    durationSeconds: 10 / 24,
    rootSeed: 12345,
    frameSeed: 67890,
    frameRandom: 0.25,
    quality,
    qualityScale,
    inputs: {
      space: definitionId === "hitStop" ? "screen" : "world",
      transform: { position: [1, 2, 3], rotation: [0, 0, 0], scale: [1, 1, 1] },
      target: null,
      parameters: {},
      blendMode: "additive",
      renderLayer: definitionId === "hitStop" ? "overlay" : "world"
    }
  };
}

describe("VfxPresetRecipeEvaluator", () => {
  it("preflights and evaluates every combat recipe deterministically", () => {
    for (const recipe of listBuiltinVfxRecipes()) {
      for (const quality of ["draft", "medium", "high", "final"] as const) {
        const active = frame(recipe.definitionId, quality);
        const first = prepareVfxPresetRecipe(active, recipe);
        const second = prepareVfxPresetRecipe(structuredClone(active), recipe);
        expect(first).toEqual(second);
        expect(first.ok).toBe(true);
        if (!first.ok) continue;
        expect(Object.isFrozen(first.value.descriptors)).toBe(true);
        expect(first.value.descriptors.every(Object.isFrozen)).toBe(true);
        const allocation = {
          particles: first.value.work.particles,
          segments: first.value.work.segments,
          stackWork: 1 + first.value.work.particles + first.value.work.segments
        };
        const evaluated = evaluatePreparedVfxPresetRecipe(active, first.value, allocation);
        expect(evaluated.ok).toBe(true);
        if (!evaluated.ok) continue;
        expect(evaluated.value.primitives).toHaveLength(first.value.descriptors.length);
        expect(JSON.stringify(evaluated)).not.toContain("NaN");
      }
    }
  });

  it("quality-scales aggregate work before allocating primitive samples", () => {
    const recipe = listBuiltinVfxRecipes().find((candidate) => candidate.id === "criticalHit");
    if (!recipe) throw new Error("critical recipe missing");
    const final = prepareVfxPresetRecipe(frame(recipe.definitionId, "final"), recipe);
    const draft = prepareVfxPresetRecipe(frame(recipe.definitionId, "draft"), recipe);
    expect(final.ok && final.value.work).toEqual({ particles: 54, segments: 96 });
    expect(draft.ok && draft.value.work).toEqual({ particles: 14, segments: 24 });
  });

  it("fails closed before evaluation for mismatches, duplicates, and aggregate overflow", () => {
    let calls = 0;
    const bad: VfxPresetRecipe = {
      version: VFX_PRESET_RECIPE_VERSION,
      id: "bad.recipe",
      definitionId: "bad.recipe",
      buildDescriptors: () => {
        calls += 1;
        return Array.from({ length: 5 }, () => ({
          version: 1 as const,
          id: "duplicate",
          kind: "particle-emitter" as const,
          color: "#ffffff",
          count: 1_024,
          shape: "point" as const,
          radius: 0,
          speed: 1,
          lifetimeSeconds: 1,
          startSize: 1,
          endSize: 0,
          startOpacity: 1,
          endOpacity: 0
        }));
      }
    };
    const result = prepareVfxPresetRecipe(frame("bad.recipe"), bad);
    expect(calls).toBe(1);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(["VFX_RECIPE_PRIMITIVE_ID_DUPLICATE"])
    );
  });
});
