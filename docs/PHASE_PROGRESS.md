# Phase Progress

## Current Phase

Phase 15 - Native Deterministic VFX Foundation

## Current Milestone

15.3 - Native VFX primitives

## Status

IN_PROGRESS - milestones 15.1 and 15.2 completed and validated; 15.3 is next.

## Completed

- Phases 1-8 completed at their documented MVP scope; remaining limitations
  are assigned to later phases rather than reopening whole phases.
- Historical Phases 9-12 are `NOT_DEFINED / DEFERRED`: only titles survive and
  no implementation criteria may be invented.
- Historical Phase 13 is `DEFERRED`: only a summary survives and explicitly
  says the distinct phase remains incomplete.
- Phase 14 architecture consolidation committed and pushed as `3a8487a`.
- Phase 15.1 typed VFX definitions, pure instances, parameter schema, registry,
  validation, inclusive timing helpers, and schema 9 compatibility adapter.
- All 12 legacy definitions are projected from the authoritative
  `EffectRegistry`; there is no copied preset dataset, project store, or lane.
- Legacy IDs, names, timing, positions, targets, parameters, and enabled state
  round-trip. Unsupported new-only fields fail reverse conversion explicitly.
- Project schema remains 9 and `track_effects_main` remains authoritative.
- Phase 15.2 stable UTF-16 hashing, typed/versioned seed derivation, and
  counter-addressed Mulberry32 sampling with fixed regression vectors.
- Pure `evaluateVfxFrame` validation, explicit inactive states, inclusive local
  timing, deterministic quality scale, resolved parameter defaults, and cloned
  primitive inputs.
- Repeated, stepped, scrubbed, reordered, structured-cloned, JSON-reloaded, and
  real schema 9 save/reopen evaluations match byte-for-byte.

## In Progress

- Phase 15 foundation. The next unit is milestone 15.3 primitive contracts and
  bounded pure primitive evaluators; no Three.js integration is planned yet.

## Not Started

- Phase 15.3 native primitives.
- Phase 15.4 timeline integration.
- Phase 15.5 schema-generated Inspector.
- Phase 15.6 schema 10 migration and serialization.
- Phase 15.7 preview/export integration.
- Phase 15.8 performance limits and resource cleanup.
- Phase 15.9 full phase validation.
- Later defined roadmap phases 16-25.

## Blockers

- None for Phase 15.3 TypeScript work.
- Host Smart App Control blocks release-profile Cargo build scripts; debug
  desktop bundles passed at `1e911af`.

## Last Validated Commit

- Repository baseline before Phase 15.1: `3a8487a`.
- Phase 15.2 is the validated checkpoint containing this document; Git history
  remains the source of truth for its resulting commit hash.

## Last Validation

- `npm install`: PASS - 108 packages audited, 0 vulnerabilities (baseline)
- `npm run typecheck`: PASS
- Focused Phase 15.2 tests: PASS - 5 files, 46 tests
- `npm test`: PASS - 56 files, 160 tests
- `npm run build`: PASS - 1,760 modules; existing 1,013.14 kB chunk warning
- `npm audit --audit-level=high`: PASS - 0 vulnerabilities
- Native checks: not rerun because Phase 15.1 changes TypeScript/docs only.

## Next Exact Action

Design milestone 15.3 around reusable, bounded, structured-cloneable primitive
descriptors. Start with pure particle, beam, trail, expanding-ring, and light-
pulse evaluators that consume the 15.2 frame contract without renderer state.
