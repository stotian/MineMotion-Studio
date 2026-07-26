import type { VfxResourcePoolLimits } from "./VfxResourcePool";

export interface VfxPoolingFixture {
  frames: number;
  particleSystemsPerFrame: number;
  lightPulsesPerFrame: number;
  dynamicMeshPrimitivesPerFrame: number;
  dynamicLinePrimitivesPerFrame: number;
}

export interface VfxAllocationEstimate {
  before: number;
  after: number;
  saved: number;
  reductionRatio: number;
}

export interface VfxPoolingEstimate {
  geometryAllocations: VfxAllocationEstimate;
  materialAllocations: VfxAllocationEstimate;
  particleBufferAllocations: VfxAllocationEstimate;
}

const MAX_FIXTURE_VALUE = 10_000;

function boundedCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_FIXTURE_VALUE, Math.floor(value)));
}

function allocationEstimate(
  before: number,
  after: number
): VfxAllocationEstimate {
  const saved = Math.max(0, before - after);
  return {
    before,
    after,
    saved,
    reductionRatio: before === 0 ? 0 : saved / before
  };
}

function pooledAllocations(
  demandPerFrame: number,
  frames: number,
  limit: number
): number {
  const pooled = Math.min(demandPerFrame, boundedCount(limit));
  const overflowPerFrame = Math.max(0, demandPerFrame - pooled);
  return pooled + overflowPerFrame * frames;
}

/**
 * Estimates constructor allocations for a steady-state VFX scene. Dynamic
 * line/ring geometry is intentionally counted unchanged because its vertices
 * differ per evaluated frame and are not pooled.
 */
export function estimateVfxPoolingAllocations(
  fixture: VfxPoolingFixture,
  limits: VfxResourcePoolLimits
): VfxPoolingEstimate {
  const frames = boundedCount(fixture.frames);
  const particleSystems = boundedCount(fixture.particleSystemsPerFrame);
  const lightPulses = boundedCount(fixture.lightPulsesPerFrame);
  const dynamicMeshes = boundedCount(fixture.dynamicMeshPrimitivesPerFrame);
  const dynamicLines = boundedCount(fixture.dynamicLinePrimitivesPerFrame);
  const meshMaterials = particleSystems + lightPulses + dynamicMeshes;
  const allMaterials = meshMaterials + dynamicLines;
  const dynamicGeometriesPerFrame = dynamicMeshes + dynamicLines;
  const reusableGeometryKinds =
    Number(particleSystems > 0) + Number(lightPulses > 0);

  return {
    geometryAllocations: allocationEstimate(
      frames * (
        particleSystems +
        lightPulses +
        dynamicGeometriesPerFrame
      ),
      frames * dynamicGeometriesPerFrame + reusableGeometryKinds
    ),
    materialAllocations: allocationEstimate(
      frames * allMaterials,
      pooledAllocations(meshMaterials, frames, limits.meshMaterials) +
        pooledAllocations(dynamicLines, frames, limits.lineMaterials)
    ),
    particleBufferAllocations: allocationEstimate(
      frames * particleSystems,
      pooledAllocations(
        particleSystems,
        frames,
        limits.particleMeshes
      )
    )
  };
}
