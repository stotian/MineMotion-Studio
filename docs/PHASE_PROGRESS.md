# Phase Progress

## Current Phase

Phase 17 - VFX Authoring and Portable Packages

## Current Milestone

17.4 - Deterministic package export/import and pre-install inspection

## Status

IN_PROGRESS - Phase 17.3 is complete; deterministic package workflows are next.

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
- Phase 15.9 extracted hostile input and project/VFX validation from the
  effects command executor without changing its public API. The 1,173-line
  controller is now a 619-line executor plus focused 236/359-line validators.
- Final Phase 15 gate passes 29 focused files/225 tests and 70 files/317 tests,
  typecheck, build, and audit. The real browser smoke was retried and remains
  environment-blocked at bootstrap with `Cannot redefine property: process`.
- Phase 16.1 adds a frozen versioned metadata catalog joined to the existing
  effect/native registries. It validates IDs, definitions, localization,
  thumbnails/assets, categories/tags, duration, qualities, schema compatibility,
  capabilities, stable claims, and primitive/global frame budgets.
- The Effects Library consumes catalog entries. Existing presets are honestly
  `compatibility`; `colorGradeKeyframe` is experimental and disabled because it
  has no visual runtime. Stable count remains zero until native parity exists.
- Phase 16.2 adds a versioned immutable native recipe contract over the existing
  primitive evaluator. Descriptors and aggregate quality-adjusted work are
  validated before global budget allocation and primitive sample generation.
- Eight combat definitions now round-trip through the existing schema 10
  effect collection and render through shared preview/export paths: sparks,
  impact, slash, parry, slam, landing dust, critical hit, and real pose-hold
  hit stop. They remain experimental until thumbnails/regression gates exist.
- Phase 16.3 generalizes recipe lookup into one built-in registry and adds eight
  native lightning/electric entries: strike, storm, beam, aura, charge, sparks,
  chain lightning, and layered weapon trail. All exposed parameters drive
  runtime output and all four quality levels pass deterministic evaluation.
- Dense storm regression reaches 8,064 allocated segments and drops later
  effects before the shared 8,192-segment limit.
- Phase 16.4 adds native fire, smoke plume, layered explosion, embers, debris,
  dust cloud, Nether fire, and soul fire through the same recipe registry.
- Phase 16.5 adds native magic aura, beam, projectile, portal, teleport, heal,
  corruption, and power-up recipes using every existing primitive family.
- Phase 16.6 adds ten native environment presets for weather and dimensions,
  with honest isotropic-motion limitations where Primitive V1 lacks direction.
- The 4,097-effect repair gate now caches adapted definitions and avoids
  redundant per-record sanitation after project validation: 17.6 s to 2.31 s.
- Phase 16.7 adds native flash, shake, glitch, bars, bloom, vignette, freeze,
  and color drain with equivalent prepared parameters in viewport/export.
- Phase 16.8 adds ten native movement recipes: the seven required movement
  families plus Elytra, Ender-pearl, and swimming variants. The catalog now has
  60 native recipes and 72 total entries; stability remains gated honestly.
- Every movement parameter has an output-influence regression. The 4,097-effect
  repair scenario now takes 0.95 s in focused measurement without validation
  caching or weakened legacy repair behavior.
- Phase 16.9 adds deterministic search, category/tag/source/favorite filters,
  bounded local favorites/recents, and honest Built-in 72 / Custom 0 views.
- Phase 16.10 generates deterministic primitive-based SVG previews one idle task
  at a time, caches them locally, and promotes exactly 60 native presets stable.
- Every stable preset passes timeline, JSON/package persistence, preview/export,
  missing-target, all-quality, thumbnail, and cache-recovery verification.
- Phase 16.11 adds four deterministic project benchmark/regression fixtures for
  family coverage, particle cap, segment cap, and dense balanced allocation.
- Final Phase 16 gate passes 23 focused files/207 tests and 77 files/353 tests,
  typecheck, build, and audit. Browser smoke remains environment-blocked.
- Phase 17.1 adds a dedicated VFX Studio workspace and versioned immutable
  authoring documents with bounded primitive, emitter, and restricted modifier
  stack unions. All 60 stable built-ins derive to clone-safe custom drafts
  without mutating catalog records or accepting executable content.
- Phase 17.2 adds pure validated commands for add, reorder, duplicate,
  enable/disable, replace, remove, target, duration, and quality edits. Ordered
  tint/opacity/scale modifiers compile to deeply frozen Primitive V1 data,
  enforce existing budgets, evaluate in the existing runtime, and feed a live
  deterministic SVG preview.
- Phase 17.3 defines closed manifest/archive contracts and an in-memory bounded
  ZIP32 reader. It rejects traversal, duplicates, code/shaders, undeclared files,
  encryption/ZIP64/symlinks, metadata/CRC/size/ratio/count violations, bad image
  dimensions, versions/licenses/dependencies/permissions, and over-budget drafts.

## In Progress

- Phase 17.4 will add deterministic package writing/round-trip tests plus package
  preview and dependency/permission reports before installation.

## Not Started

- Phase 17.4 and later VFX package milestones, plus phases 18-35.

## Blockers

- None for current Phase 17 TypeScript work.
- Final Phase 15 browser smoke is environment-blocked because the in-app
  browser client cannot attach (`Cannot redefine property: process`).
- Host Smart App Control blocks release-profile Cargo build scripts; debug
  desktop bundles passed at `1e911af`.

## Last Validated Commit

- Repository baseline before Phase 15.1: `3a8487a`.
- Phase 17.3 is the validated checkpoint containing this document; Git history
  remains the source of truth for its resulting commit hash.

## Last Validation

- `npm install`: PASS - 108 packages audited, 0 vulnerabilities
- `npm run typecheck`: PASS
- Focused Phase 17.3 tests: PASS - 4 files, 15 tests
- `npm test`: PASS - 80 files, 367 tests
- `npm run build`: PASS - 1,805 modules; existing large-chunk warning only
- `npm audit`: PASS - 0 vulnerabilities
- Native checks: not rerun because Phase 17.3 changes TypeScript/docs only.
- Manual visual smoke: BLOCKED_BY_ENVIRONMENT - browser bootstrap repeats
  `Cannot redefine property: process`; automated characterization passes.

## Next Exact Action

Implement deterministic Phase 17.4 `.minemotion-vfx` writing and byte-stable
round trips, then expose preview/dependency/permission reports before install.
