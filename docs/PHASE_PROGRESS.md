# Phase Progress

## Current Phase

Phase 15 - Native Deterministic VFX Foundation

## Current Milestone

15.5 - Schema-generated VFX Inspector controls

## Status

IN_PROGRESS - milestones 15.1 through 15.4 completed and validated; 15.5 is next.

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
- Phase 15.3 versioned primitive descriptor/output unions and pure dispatcher
  for particle emitter, beam, trail, expanding ring, and light pulse.
- Allocation caps, clamp warnings, finite-output checks, stable per-channel
  seeds, literal particle quality prefixes, and nested beam/trail/ring samples.
- Renderer-neutral placement/points/scalars remain cloneable and cannot alias
  frame or descriptor input data.
- Phase 15.4 pure effects timeline commands for insert/edit/move/trim,
  duplicate, copy/paste, enable, priority, delete, and canonical lane sync.
- Real timeline drag/trim handles and Effects Library/Inspector edits, with one
  HistoryStack checkpoint per successful non-no-op command.
- Save/reload/package/undo/redo preservation for effect timing, order, names,
  enabled state, payloads, canonical labels, and foreign lanes.
- Bounded plain-data validation, 4,096-instance editor growth ceiling with
  oversized legacy repair, and legacy renderer stack/particle budgets.

## In Progress

- Phase 15 foundation. The next unit is milestone 15.5 schema-generated
  Inspector controls over the same schema 9 command/history path.

## Not Started

- Phase 15.5 schema-generated Inspector.
- Phase 15.6 schema 10 migration and serialization.
- Phase 15.7 preview/export integration.
- Phase 15.8 performance limits and resource cleanup.
- Phase 15.9 full phase validation.
- Later defined roadmap phases 16-25.

## Blockers

- None for Phase 15.4 TypeScript work.
- Host Smart App Control blocks release-profile Cargo build scripts; debug
  desktop bundles passed at `1e911af`.

## Last Validated Commit

- Repository baseline before Phase 15.1: `3a8487a`.
- Phase 15.4 is the validated checkpoint containing this document; Git history
  remains the source of truth for its resulting commit hash.

## Last Validation

- `npm install`: PASS - 108 packages audited, 0 vulnerabilities (baseline)
- `npm run typecheck`: PASS
- Focused Phase 15.4 tests: PASS - 8 files, 96 tests
- `npm test`: PASS - 62 files, 256 tests
- `npm run build`: PASS - 1,769 modules; existing 1,050.38 kB chunk warning
- `npm audit --audit-level=high`: PASS - 0 vulnerabilities
- Native checks: not rerun because milestone 15.4 changes TypeScript/docs only.

## Next Exact Action

Audit `VfxParameterSchema`, the legacy `EffectRegistry`, current effect
Inspector controls, and the 15.4 command controller. Generate honest controls
for every supported schema parameter and route committed edits through the same
validated history path. Do not invent parameter keyframes or schema 10 fields.
