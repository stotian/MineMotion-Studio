# Phase 16.2 - Native Recipes And Combat VFX

Phase 16.2 adds the first code-defined native preset family without introducing
a second project collection, effect registry, or frame evaluator.

## Recipe contract

- Recipes are trusted built-in TypeScript, versioned at `VFX_PRESET_RECIPE_VERSION = 1`.
- A recipe must match its active VFX definition and may compose at most 16 of
  the five Phase 15 primitive descriptor kinds.
- Every descriptor is validated, cloned, and frozen before evaluation.
- Aggregate quality-adjusted particle, segment, and stack work is measured
  before primitive sample arrays are allocated.
- The existing global frame budget allocates the prepared work. Only then does
  the recipe call the existing `evaluateVfxPrimitive` dispatcher.
- Invalid definitions, descriptors, duplicate primitive IDs, or excessive work
  fail closed with structured validation issues.

## Combat family

The existing EffectRegistry, VfxRegistry projection, schema 10 serializer,
timeline lane, Inspector, prepared-frame runtime, and render/export paths now
support these eight definitions:

- `combatSparks`: deterministic particle burst.
- `combatImpact`: expanding ring plus light pulse.
- `swordSlash`: tapered arc trail.
- `parryBurst`: crossed beams plus defensive ring.
- `groundSlam`: debris particles plus large ground ring.
- `landingDust`: low dust particles plus subtle ring.
- `criticalHit`: particles, high-contrast ring, and light pulse.
- `hitStop`: holds sampled animation pose while the global timeline/VFX frame
  continues, with a short screen accent.

World primitives render through the shared Three.js scene path and therefore
feed the same viewport canvas used by PNG, sequence, WebM, and FFmpeg export.
The hit-stop overlay is shared by viewport and composited capture. Disabling
VFX for final export also disables the pose hold.

## Compatibility and maturity

Old schemas 1-9 continue migrating through schema 10 unchanged, and the legacy
12 effect types retain their compatibility renderers. New combat definitions
round-trip through JSON and native VFX persistence using the existing effect
collection. The combat entries remain labelled `experimental`, despite working
preview/export paths, until Phase 16 preview thumbnails and the stable-preset
regression gate are complete. Stable preset count therefore remains zero.

Known limitation: hit stop does not pause audio playback.
