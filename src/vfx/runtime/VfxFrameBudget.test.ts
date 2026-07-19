import { describe, expect, it } from "vitest";
import {
  VFX_GLOBAL_FRAME_LIMITS,
  createEmptyVfxFrameBudgetSummary,
  measureLegacyVfxEffectWork,
  requestVfxEffectBudget
} from "./VfxFrameBudget";

describe("VFX global frame budgets", () => {
  it("measures the allocation costs used by current render consumers", () => {
    expect(measureLegacyVfxEffectWork("lightningStrike", 0)).toEqual({
      particles: 0,
      segments: 8
    });
    expect(measureLegacyVfxEffectWork("shockwave", 0).segments).toBe(96);
    expect(measureLegacyVfxEffectWork("speedLines", 0).segments).toBe(42);
    expect(measureLegacyVfxEffectWork("glowBurst", 100_000).particles).toBe(
      1_024
    );
  });

  it("caps particles before consumers allocate instance buffers", () => {
    const budget = createEmptyVfxFrameBudgetSummary();
    const allocations = Array.from({ length: 6 }, () =>
      requestVfxEffectBudget(budget, { particles: 1_024, segments: 0 })
    );

    expect(allocations.slice(0, 4).every(Boolean)).toBe(true);
    expect(allocations.slice(4)).toEqual([null, null]);
    expect(budget.allocated.particles).toBe(
      VFX_GLOBAL_FRAME_LIMITS.particles
    );
    expect(budget.requested.particles).toBe(6_144);
    expect(budget.droppedEffects).toBe(2);
  });

  it("bounds segments, effect count, and mixed stack work independently", () => {
    const segmentBudget = createEmptyVfxFrameBudgetSummary();
    while (
      requestVfxEffectBudget(segmentBudget, { particles: 0, segments: 96 })
    ) {
      // Consume a stable prefix until the next complete ring cannot fit.
    }
    expect(segmentBudget.allocated.segments).toBeLessThanOrEqual(
      VFX_GLOBAL_FRAME_LIMITS.segments
    );
    expect(segmentBudget.droppedEffects).toBe(1);

    const effectBudget = createEmptyVfxFrameBudgetSummary();
    for (let index = 0; index < VFX_GLOBAL_FRAME_LIMITS.effects + 2; index += 1) {
      requestVfxEffectBudget(effectBudget, { particles: 0, segments: 0 });
    }
    expect(effectBudget.allocated.effects).toBe(
      VFX_GLOBAL_FRAME_LIMITS.effects
    );
    expect(effectBudget.droppedEffects).toBe(2);

    const stackBudget = createEmptyVfxFrameBudgetSummary();
    expect(
      requestVfxEffectBudget(stackBudget, { particles: 4_000, segments: 5_900 })
    ).not.toBeNull();
    expect(
      requestVfxEffectBudget(stackBudget, { particles: 1, segments: 100 })
    ).toBeNull();
    expect(stackBudget.allocated.particles).toBeLessThanOrEqual(
      VFX_GLOBAL_FRAME_LIMITS.particles
    );
    expect(stackBudget.allocated.segments).toBeLessThanOrEqual(
      VFX_GLOBAL_FRAME_LIMITS.segments
    );
    expect(stackBudget.allocated.stackWork).toBeLessThanOrEqual(
      VFX_GLOBAL_FRAME_LIMITS.stackWork
    );
  });
});
