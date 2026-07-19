# Phase Progress

## Current Phase

Phase 15 - Native Deterministic VFX Foundation

## Current Milestone

15.9 - Phase 15 stabilization gate

## Status

IN_PROGRESS - milestones 15.1 through 15.8 completed and validated; final stabilization is next.

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
- Phase 15.5 schema-generated Inspector controls for number, integer, boolean,
  color, and enum parameters, with metadata, defaults, bounds, runtime-support
  disclosure, and honest keyframe deferral.
- Parameter commits use the existing schema 9 timeline controller. Invalid
  legacy values can be repaired without dropping unknown keys, and safe color
  tokens are enforced before renderer consumption.
- Phase 15.6 project schema 10 with deterministic migrations from schemas 1-9,
  one native VFX record per existing effect, synchronized identity/timing/data,
  persisted seed/transform/target/parameters/local keyframes/blend/layer/
  qualities, and explicit future/corruption rejection.
- JSON, `.minemotion`, browser autosave, history, and package render jobs share
  the canonical serializer. Autosave retains a previous payload for recovery;
  lossless schema 9 rollback rejects native-only fields instead of dropping them.
- Phase 15.7 makes schema 10 native frame preparation the shared runtime input
  for Three.js world effects, React overlays, PNG/sequence, WebM, and FFmpeg.
  Local parameter keyframes evaluate deterministically, targets resolve with
  warnings, and `includeVfx=false` short-circuits every VFX layer.
- WebM now records the same composited captured frames as PNG/FFmpeg at the
  selected output resolution; render state restores export settings as well as
  camera/timeline state after completion, error, or cancellation.
- Phase 15.8 measures and enforces one deterministic pre-allocation frame budget:
  64 active effects, 4,096 particles, 8,192 segments, and 10,000 combined stack
  work units. Prepared frames report requested/allocated work and limit hits.
- Scene reconstruction now recursively disposes owned geometries, materials,
  textures, render targets, skeletons, buffers, and roots while preserving
  explicitly shared Minecraft material/skin caches. WebM releases bitmaps,
  tracks, and listeners on success, retry, cancellation, and recorder error.
- Repeated add/remove/reopen cycles retain schema 10 native identity and leave
  no effects behind; imported-chunk temporary border geometry is also released.

## In Progress

- Phase 15 foundation. The next unit is milestone 15.9: final controller audit,
  visual-smoke retry, complete stabilization gate, and phase handoff.

## Not Started

- Phase 15.9 full phase validation.
- Later defined roadmap phases 16-25.

## Blockers

- None for Phase 15.9 TypeScript work.
- Manual Phase 15.5 browser smoke is environment-blocked because the in-app
  browser client cannot attach (`Cannot redefine property: process`).
- Host Smart App Control blocks release-profile Cargo build scripts; debug
  desktop bundles passed at `1e911af`.

## Last Validated Commit

- Repository baseline before Phase 15.1: `3a8487a`.
- Phase 15.8 is the validated checkpoint containing this document; Git history
  remains the source of truth for its resulting commit hash.

## Last Validation

- `npm install`: PASS - 108 packages audited, 0 vulnerabilities
- `npm run typecheck`: PASS
- Focused Phase 15.8 tests: PASS - 21 files, 115 tests
- `npm test`: PASS - 70 files, 317 tests
- `npm run build`: PASS - existing large-chunk warning only
- `npm audit`: PASS - 0 vulnerabilities
- Native checks: not rerun because milestone 15.8 changes TypeScript/docs only.
- Manual visual smoke: not rerun in 15.8; the documented browser bootstrap
  environment failure remains and automated lifecycle/presentation tests pass.

## Next Exact Action

Start Phase 15.9 by auditing oversized VFX controllers against existing
characterization coverage. Split only if ownership materially improves without
behavior change, retry the real visual smoke, then run the complete Phase 15 gate.
