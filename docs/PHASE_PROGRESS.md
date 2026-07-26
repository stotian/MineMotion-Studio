# Phase Progress

## Current Phase

Phase 20 - Renderer, Performance, and Large Scenes

## Current Milestone

20.12 - Incremental App orchestration extraction

## Status

IN_PROGRESS - Phase 20.1-20.11 measurement, renderer optimization, worker/
abort reliability, and measured bundle splitting are implemented and validated.

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
- Phase 19.3 segments Steve/Alex arms and legs into backward-compatible physical
  upper/lower child bones while preserving neutral geometry and upper-bone IDs.
- Rig Studio exposes bounded numeric hand/foot targets, poles, enable state,
  influence, current frame, deterministic live preview, and real bake actions.
- Every successful bake writes exactly two authoritative global tracks in one
  history checkpoint; invalid and no-op operations create none. Undo/redo,
  schema 10, guarded schema 9, packages, autosave, timeline, and export sampling
  remain on the existing paths.
- Quaternion influence, ideal/evaluated FK positions, local `-Y`/XYZ assumptions,
  mirrored limbs, limits, reach clamps, hostile inputs, and all four limbs have
  focused regressions.
- Rig/pose/IK orchestration moved out of `App.tsx`, reducing it from 2,839 to
  2,677 lines. A reviewed architecture ceiling, CI workflow, strict SemVer,
  version policy, risk/debt register, and manual smoke checklist are present.
- Phase 19.4 extracts renderer-neutral terrain presets and deterministically
  samples supporting surfaces from embedded imported chunks or active presets.
- Bounded left/right foot anchors preserve one fixed ground-aligned world target
  across an inclusive range. Frame sampling accounts for character transform,
  root rotation, and both leg joints, with a Three.js hierarchy regression.
- Every reachable range writes two authoritative global tracks in one history
  operation. Missing ground, invalid/oversized ranges, zero scale, locked rigs,
  and unreachable motion fail atomically; identical rebakes are no-ops.
- Rig Studio exposes localized bounded start/end/ground-offset controls only for
  feet. No persisted constraint state, parallel timeline, or per-frame undo is
  introduced.
- Phase 19.5 adds one pure bounded look-at solver for renderer `XYZ` rig/object
  and production-camera `YXZ`, with quaternion influence, limits, deterministic
  up fallback, evaluated direction, and hostile-input guards.
- Head mapping converts animated targets through character transform, root, and
  body into parent space; camera/object mapping uses sampled world coordinates.
- Localized session controls select an animated target or custom world position,
  preview deterministically, and bake one existing head/transform rotation track
  through one history operation. Eye direction follows the head as disclosed.
- Constraint composition moved to `useRigConstraintWorkspace`; `App.tsx` remains
  unchanged at 2,678 lines from the Phase 19.4 baseline.
- Phase 19.6 derives bounded root, left/right hand, and camera paths from the
  authoritative tracks with exact production interpolation, key points, duration,
  distance, bounds, and a Three.js hand-hierarchy parity regression.
- Localized range/visibility controls feed one disposable viewport polyline and
  key-point set. Playback frame-only changes do not resample the whole path, and
  production render preview/export excludes all path helpers.
- Paths remain session-only. Optional direct path editing is deferred until it
  can delegate to existing global keyframe commands.
- Phase 19.7 reuses `animation.nlaTracks` for six fixed layer kinds, samples
  them after global tracks in every production/tool path, exposes localized
  mute/weight/VFX-reference controls, and passes all persistence/history gates.
- Phase 19.8 provides all ten bounded deterministic generators. Each produces
  one reusable clip plus editable global keys through existing history, with
  full save/package/autosave/schema 9 and production-sampling coverage.
- Phase 19.9 adds selection-scoped redundant-key removal, bounded noise
  reduction, smoothing, loop, reverse, and renderer-consistent rig/transform
  mirroring. Transform commands are immutable, collision-safe, deterministic,
  duration-bounded, and atomic through the existing Dopesheet/history path.
- Phase 19.10 adds a detached session-only pose clipboard, compatible-bone
  paste, and bounded pose blending while preserving existing save/apply/mirror/
  reset behavior. Project commands reject locked, missing, invalid, and no-op
  actions atomically and pass every persistence/production path.
- Phase 19.11 keeps attachment motion derived from authoritative bone tracks,
  adds bounded atomic authoring and diagnostics, and resolves real imported OBJ
  assets in the shared preview/export renderer. No parallel attachment timeline
  or duplicated animation data was introduced.
- Phase 19.12 accepts current Blockbench outliners and legacy groups under
  explicit resource limits. Static OBJ conversion now bakes cube inflation,
  enabled faces, nested hierarchy names, pivots, and element/group rotations
  deterministically.
- Texture and clip metadata are preserved and reported without claiming that
  MineMotion's static material or rig mapping already consumes them. The
  authoritative asset collection is reconciled across JSON, schema 9, packages,
  autosave, and history, with a compatibility projection for legacy rig data.
- Phase 19.13 resolves only unique normalized bone IDs and an explicit alias
  table automatically. Ambiguous and unknown groups remain unmapped until the
  user stores a preset-scoped manual target or explicit exclusion.
- Bounded numeric Blockbench rotation keys convert to deterministic reusable
  clips and apply through the existing global tracks, timeline synchronizer, and
  one history operation. Expressions, unsupported channels/interpolation, and
  unmapped animators are skipped with stable diagnostics.
- Phase 19.14 adds six bounded optional pixel-expression presets over the head:
  blink, anger, sadness, confidence, surprise, and fear. Absent, disabled,
  invalid, or zero-intensity settings create no overlay geometry.
- Expression descriptors are pure and renderer-neutral. Shared preview/export
  head rendering owns the small overlay meshes, while project commands and
  localized Rig Studio controls commit at most one history checkpoint.
- Phase 19.15 adds one composite regression over expression, attachment, and
  authoritative bone animation. It crosses JSON, schema 9, project packages,
  autosave, history, rig-lane synchronization, production sampling, preview
  rig construction, and final-export frame preparation.
- The complete Phase 19 gate passes with every specialized rig test retained;
  no duplicate timeline, per-frame history stream, or alternate renderer was
  introduced.
- Phase 20.1 instruments the actual viewport render loop with rolling FPS and
  best/average/p95/worst frame time, dropped frames, Three.js render/memory
  counters, project scene/chunk/effect counts, viewport startup, and optional
  Chromium heap usage.
- Metrics are bounded session-only plain data, emitted at most every 500 ms, and
  shown through the existing diagnostics setting without entering project
  schema, history, autosave, canvas capture, or final renders.
- Phase 20.2 defines immutable version 1 Minimum/Recommended device budgets and
  Draft/High/Final quality budgets over startup, p95, heap, calls, triangles,
  geometries, textures, scene objects, chunks, and active effects.
- Pure evaluation distinguishes recommendations from hard-limit violations,
  defers p95 until 30 samples, and treats optional or hostile measurements as
  unavailable. It never changes quality or project state.
- Phase 20.3 defines immutable semantic ownership for world, characters, props,
  transparency, VFX, post, overlays, and helpers. Three.js objects are tagged
  without forcing a new painter order or camera mask.
- The final WebGL canvas now excludes grid/axes, selection, camera models, motion
  paths, chunk borders, and the world-origin marker while preserving editor
  preferences. Preview/export post-pipeline differences remain documented.
- Phase 20.4 gives the single production renderer explicit material/skin cache
  cleanup, fixes stale material identity, prunes inactive skins, disposes
  parser-owned OBJ materials and temporary geometry, and lazily allocates chunk
  geometry.
- Audio elements/context/nodes, Blob URLs, WebM resources, callbacks, controls,
  listeners, RAF, render lists, and owned Three.js trees have characterized
  cleanup paths. Audio orchestration left `App.tsx`, reducing it to 2,642 lines.
- Phase 20.5 adds bounded pure layer/distance/frustum sphere decisions with
  editor selection override, fail-open invalid/overflow handling, and live
  per-reason plus chunk visibility counters.
- Imported blocks stay instanced by material inside independently cullable chunk
  groups. Final distance equals camera far and no persistent object visibility
  is changed.
- Phase 20.6 measures global versus chunk-local material batches. At the
  16-chunk/17-material default bound, chunk-local work uses 272 world calls
  all-visible and rejects 75% of instances when only 4 chunks are visible.
- Every imported chunk mesh in one build now shares one lazily allocated cube
  geometry, while unchanged material contexts and identical active skins prove
  cache reuse without weakening Phase 20.4 invalidation.
- Phase 20.7 reuses fixed unit VFX geometry, bounded per-frame material slots,
  and bounded particle instance buffers under one renderer owner. Owned
  `InstancedMesh` attributes now dispose on rebuild and pooled attributes
  dispose once on growth or shutdown.
- The 120-frame VFX allocation fixture reduces geometry constructors from
  15,360 to 5,762 and material/particle-buffer constructors from 15,360/7,680
  to 128/64 without pooling dynamic line or ring topology.
- Phase 20.8 moves production Minecraft material/texture and skin caches from
  module singletons to each renderer. Identical assets in two renderers have
  independent resources and disposal.
- Parsed OBJ templates are lazy and retained only for visible object/attachment
  consumers. Rebuild clones share cache-owned geometry/materials while source
  change, removal, hiding, and shutdown dispose exactly once.
- The dormant chunk mesh cache remains inactive but now disposes replaced,
  deleted, and cleared object trees with aggregate lifecycle counters.
- Phase 20.9 transfers compressed chunk copies to one reusable import worker for
  decompression, NBT, palette/section decoding, and plain chunk construction.
  The original region remains intact for deterministic bootstrap fallback.
- A typed audit keeps fixed MCA headers bounded on main, Three.js mesh work on
  the renderer, DOM atlas work deferred, archives bounded, and thumbnails on
  their existing cancellable idle scheduler.
- Phase 20.10 threads abort through world scans, region/chunk import, browser
  yields, and worker decode. Monotonic public operation IDs tag progress/results;
  worker replies require matching request and operation IDs.
- Starting newer work, replacing a project, unloading a world, cancelling, or
  unmounting invalidates old results before project/history writes. Active
  worker decode terminates promptly and `App.tsx` shrinks to 2,474 lines through
  the extracted `useWorldImportOperations` controller.
- Phase 20.11 defers ten closed panels behind a localized Suspense/error
  boundary and six guarded Blockbench/resource-pack/render/export workflow
  families behind explicit dynamic imports.
- The main bundle falls from 1,542.64/421.39 kB gzip to 1,439.60/397.66 kB,
  while eighteen named deferred chunks total 110.64 kB. Startup-critical
  React/Three.js/editor code remains static and the >500 kB warning is not hidden.

## In Progress

- Implement Phase 20.12 by extracting the next cohesive App orchestration
  boundary into existing domain controllers without a broad rewrite.

## Not Started

- Phase 20 tasks 13-17 and phases 21-35.

## Blockers

- None for current Phase 20 TypeScript work.
- Final Phase 15 browser smoke is environment-blocked because the in-app
  browser client cannot attach (`Cannot redefine property: process`).
- Host Smart App Control blocks release-profile Cargo build scripts; debug
  desktop bundles passed at `1e911af`.

## Last Validated Commit

- Official verified ZIP baseline: `4c6213b`.
- Latest committed and pushed implementation checkpoint: `ba46bfd`
  (Phase 20.11 deferred panels/workflows).
- Latest validated implementation checkpoint: Phase 20.11.

## Last Validation

- `npm ci --no-audit --no-fund`: PASS - 110 packages installed
- `npm run typecheck`: PASS
- Focused Phase 20.11 deferred contract tests: PASS - 1 file, 2 tests
- `npm test`: PASS - 139 files, 593 tests
- `npm run verify:locales`: PASS - 4 files, 11 tests
- `npm run verify:vfx-examples`: PASS - 1 file, 1 test
- `npm run verify:architecture`: PASS - `App.tsx` 2,474/2,839 lines
- `npm run build`: PASS - 1,890 modules; 1,439.60 kB main, 7.61 kB worker,
  and eighteen deferred chunks
- `npm audit --audit-level=high`: PASS - 0 vulnerabilities
- Native checks: not rerun because this milestone changes frontend TypeScript
  and documentation only.
- Manual visual smoke: BLOCKED_BY_ENVIRONMENT - browser bootstrap repeats
  `Cannot redefine property: process` or times out during local navigation;
  automated characterization passes and the manual checklist is unpassed.

## Next Exact Action

Characterize one remaining cohesive responsibility in `App.tsx`, prefer an
existing controller/service boundary, extract state/commands without changing
history or persistence behavior, and keep the architecture size gate decreasing.
