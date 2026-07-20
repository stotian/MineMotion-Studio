# Phase Progress

## Current Phase

Phase 19 - Advanced Minecraft Rigging and Animation

## Current Milestone

19.2 - Deterministic two-bone IK solver

## Status

IN_PROGRESS - Phase 19.1 and 19.2 are implemented and validated.

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
- Phase 17.4 writes byte-stable canonical stored ZIP archives, self-validates
  them through the bounded reader, and proves export/import/rewrite equality
  with assets. VFX Studio exports drafts and shows preview, budgets, licenses,
  permissions, assets, dependencies, compatibility, and readiness pre-install.
- Phase 17.5 adds a bounded versioned local registry that reparses canonical
  archive bytes on load. Install/update/enable/disable/inspect/uninstall protect
  built-ins, require compatible enabled dependencies, prevent breaking active
  dependents, persist immutably, and fail soft on corrupt/unavailable storage.
- Phase 17.6 validates/resolves every declared asset kind through closed bounded
  schemas: PNG texture/sprite/thumbnail, signed audio, box models, gradients,
  curves, localization, and three parameter-only shader templates. JSON shape
  limits and Primitive V1 material fallback keep executable source impossible.
- Phase 17.7 exposes enabled installed packages in the existing Effects Library
  and inserts them into the single `effects.instances` collection. Schema 10
  embeds immutable compiled descriptors plus package provenance, so timeline
  edits, history, JSON/packages/autosave, preview, and export share one runtime.
- Disabled, missing, or version-changed local sources are visible in the scene
  effect list while their self-contained project recipe remains deterministic.
  Schema 9 export rejects custom recipes explicitly instead of losing them.
- Phase 17.8 ships two deterministic CC0 example archives generated from
  declarative sources through the production writer/reader. Exact bytes and
  SHA-256 checksums have a read-only drift gate.
- Author documentation covers the complete safe workflow, package limits,
  assets, permissions, dependencies, lifecycle, persistence, and failures.
- Node-graph research keeps the stable ordered stack authoritative and records
  strict schema/compiler/security/accessibility evidence required before a
  future graph can be considered.
- Phase 18 ships one typed English/French localization contract with system or
  explicit locale selection, English fallback, interpolation, plurals, date/
  number/duration/timecode formatting, and runtime pseudolocalization.
- Menus, shell/status, Settings, Inspector, Outliner, viewport, timeline,
  Dopesheet/Graph, Effects Library, VFX Studio, export/render queue, world and
  rig workflows, lighting, templates, plugins, commands, shortcuts, and help
  consume the same service. Stable diagnostic codes survive translation.
- App language persists outside project data. English/French/pseudolocale
  switching is regression-tested not to mutate projects or schema 10 data.
- Safe package-owned localization JSON can override only VFX package display
  name and description for an exact or language-compatible locale; validated
  manifest content remains the deterministic fallback and no code executes.
- Automatic catalog parity, missing/extra key, placeholder, raw production
  string, pseudolocale length, French overflow, and small-window CSS gates run
  through `npm run verify:locales`.
- Phase 19.1 adds a versioned bounded rig contract over the existing Steve,
  Alex, generic, mob-placeholder, bone, attachment, pose, and track types.
- The global animation timeline is now explicitly authoritative for bone motion.
  Legacy per-character `boneKeyframes` migrate into missing global frames and are
  regenerated as a compatibility projection on every persistence boundary.
- Existing track values win deterministic conflicts. Rig definitions reject
  duplicate/missing/cyclic bones, bad vectors, and invalid attachment points;
  character vectors, attachments, and saved poses are bounded and sanitized.
- JSON, schema 9 rollback/reopen, project packages, autosave, history, rig lane,
  and Animator sampling preserve reconciled bones, attachments, and poses.
- Phase 19.2 replaces the registered IK placeholder with a pure analytic two-bone
  solver. It computes exact joint/end positions, hierarchical local rotations,
  deterministic pole fallback, influence, component limits, and explicit reach.
- Too-far and too-close targets clamp to physical reach with stable warnings;
  invalid lengths, joint counts, target vectors, and root-coincident targets fail
  without NaN/Infinity. Three.js quaternion reconstruction verifies rotations.

## In Progress

- Phase 19.3 will add production hand/foot targets, pole controls, enable/
  influence state, and bake solved limb rotations to existing timeline tracks.

## Not Started

- Phase 19.3-19.15 and phases 20-35.

## Blockers

- None for current Phase 19 TypeScript work.
- Final Phase 15 browser smoke is environment-blocked because the in-app
  browser client cannot attach (`Cannot redefine property: process`).
- Host Smart App Control blocks release-profile Cargo build scripts; debug
  desktop bundles passed at `1e911af`.

## Last Validated Commit

- Repository baseline before Phase 15.1: `3a8487a`.
- Phase 19.1 is the validated checkpoint containing this document; Git history
  remains the source of truth for its resulting commit hash.

## Last Validation

- `npm install`: PASS - 110 packages audited, 0 vulnerabilities
- `npm run typecheck`: PASS
- Focused Phase 19.2 tests: PASS - 1 file, 4 tests
- `npm test`: PASS - 91 files, 405 tests
- `npm run build`: PASS - 1,824 modules; existing large-chunk warning only
- `npm audit`: PASS - 0 vulnerabilities
- Native checks: not rerun because Phase 19.1 changes TypeScript/docs only.
- Manual visual smoke: BLOCKED_BY_ENVIRONMENT - browser bootstrap repeats
  `Cannot redefine property: process`; automated characterization passes.

## Next Exact Action

Add hand/foot targets, pole controls, enable/influence state, and deterministic
bake-to-keyframes through the existing global bone animation tracks.
