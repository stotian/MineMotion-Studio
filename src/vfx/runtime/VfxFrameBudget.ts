import {
  MAX_LEGACY_ACTIVE_WORLD_EFFECTS,
  MAX_LEGACY_EFFECT_PARTICLE_COUNT,
  MAX_LEGACY_PARTICLES_PER_FRAME,
  type EffectType
} from "../../effects/EffectTypes";

export const VFX_GLOBAL_FRAME_LIMITS = Object.freeze({
  effects: MAX_LEGACY_ACTIVE_WORLD_EFFECTS,
  particles: MAX_LEGACY_PARTICLES_PER_FRAME,
  segments: 8_192,
  stackWork: 10_000
});

export interface VfxFrameWork {
  effects: number;
  particles: number;
  segments: number;
  stackWork: number;
}

export interface VfxFrameBudgetSummary {
  limits: VfxFrameWork;
  requested: VfxFrameWork;
  allocated: VfxFrameWork;
  droppedEffects: number;
  limitHits: VfxFrameWork;
}

export interface VfxEffectBudgetAllocation {
  particles: number;
  segments: number;
  stackWork: number;
}

export interface VfxEffectWorkRequest {
  particles: number;
  segments: number;
}

export function createEmptyVfxFrameBudgetSummary(): VfxFrameBudgetSummary {
  return {
    limits: { ...VFX_GLOBAL_FRAME_LIMITS },
    requested: emptyWork(),
    allocated: emptyWork(),
    droppedEffects: 0,
    limitHits: emptyWork()
  };
}

export function measureLegacyVfxEffectWork(
  type: EffectType,
  requestedParticleCount: number
): VfxEffectWorkRequest {
  return {
    particles:
      type === "glowBurst"
        ? Math.max(
            0,
            Math.min(
              MAX_LEGACY_EFFECT_PARTICLE_COUNT,
              Math.round(requestedParticleCount)
            )
          )
        : 0,
    segments:
      type === "lightningStrike"
        ? 8
        : type === "shockwave"
          ? 96
          : type === "speedLines"
            ? 42
            : 0
  };
}

export function requestVfxEffectBudget(
  summary: VfxFrameBudgetSummary,
  request: VfxEffectWorkRequest
): VfxEffectBudgetAllocation | null {
  const requestedStackWork = 1 + request.particles + request.segments;
  summary.requested.effects += 1;
  summary.requested.particles += request.particles;
  summary.requested.segments += request.segments;
  summary.requested.stackWork += requestedStackWork;

  if (summary.allocated.effects >= summary.limits.effects) {
    summary.limitHits.effects += 1;
    summary.droppedEffects += 1;
    return null;
  }

  const remainingSegments =
    summary.limits.segments - summary.allocated.segments;
  if (request.segments > remainingSegments) {
    summary.limitHits.segments += 1;
    summary.droppedEffects += 1;
    return null;
  }

  const remainingStackWork =
    summary.limits.stackWork - summary.allocated.stackWork;
  const fixedStackWork = 1 + request.segments;
  if (fixedStackWork > remainingStackWork) {
    summary.limitHits.stackWork += 1;
    summary.droppedEffects += 1;
    return null;
  }

  const remainingParticles =
    summary.limits.particles - summary.allocated.particles;
  const remainingParticleStackWork = remainingStackWork - fixedStackWork;
  const particles = Math.min(
    request.particles,
    remainingParticles,
    remainingParticleStackWork
  );
  if (request.particles > remainingParticles) summary.limitHits.particles += 1;
  if (request.particles > remainingParticleStackWork) {
    summary.limitHits.stackWork += 1;
  }
  if (request.particles > 0 && particles <= 0) {
    summary.droppedEffects += 1;
    return null;
  }

  const allocation = {
    particles,
    segments: request.segments,
    stackWork: fixedStackWork + particles
  };
  summary.allocated.effects += 1;
  summary.allocated.particles += allocation.particles;
  summary.allocated.segments += allocation.segments;
  summary.allocated.stackWork += allocation.stackWork;
  return allocation;
}

function emptyWork(): VfxFrameWork {
  return { effects: 0, particles: 0, segments: 0, stackWork: 0 };
}
