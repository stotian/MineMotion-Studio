# Current State

MineMotion Studio `0.8.2` uses project schema 10.

Phase 14 architecture consolidation and the complete Phase 15 native VFX
foundation are finished. Low-level contracts have stable ownership under
`src/core`, and typed deterministic VFX, editing, schema 10 persistence,
preview/export budgets, and explicit renderer ownership now coexist.

## Working Systems

- React/Three.js editor shell, viewport, inspector, outliner, timeline, settings, templates, commands, autosave, and undo/redo.
- Minecraft Java world import MVP with bounded modern palette chunks.
- Steve/Alex rigs, skins, poses, bone tracks, animation presets, attachments, and static Blockbench geometry import.
- Resource pack/material/lighting studio MVP with atmosphere and environment keys.
- Timeline, Dopesheet, Graph view, markers, reusable clips, and NLA skeleton.
- Cinematic preset effects and post-processing preview/export overlays.
- `.minemotion`/`.mmsproj` save/load and migrations from schemas 1-9 to 10.
- Production render queue, validation, estimates, PNG/ZIP/WebM/WAV/package/metadata output, final camera, render logs, and native FFmpeg bridge.
- Windows Tauri debug application plus MSI/NSIS generation.
- Stable core contracts for IDs, frame time/playback, scene entities, schema,
  migrations, validation, and typed engine errors.
- Central evidence-based capability registry. Existing WebM, WAV, and Tauri
  support helpers delegate to it.
- Documented service boundaries for future extraction from `App.tsx`.
- Typed `src/vfx/core` definitions, pure instances, parameter schemas,
  validation, and registry behavior.
- A schema 9 compatibility adapter derived from the existing effect registry.
  It preserves every legacy field, inclusive timing, targets, parameters, and
  deterministic fallback seeds, and rejects lossy reverse conversion.
- A pure deterministic VFX frame evaluator with fixed hash/PRNG vectors,
  explicit frame/FPS/context-seed/quality inputs, inclusive timing, resolved
  defaults, stable local-frame randomness, and JSON-safe primitive inputs.
- Versioned renderer-neutral primitive contracts and pure evaluators for burst
  particles, jittered beams, explicit-point trails, expanding rings, and light
  pulses, with hard allocation caps and deterministic quality refinement.
- A pure validated effects timeline controller for insert/edit/move/trim,
  duplicate, copy/paste, enable, priority, delete, and deterministic lane sync.
- Effects Library, timeline blocks/handles, and committed Inspector controls
  perform real edits through whole-project history, including undo/redo and
  save/package round-trip.
- Foreign timeline lanes are canonicalized as bounded plain data, while schema
  10 keeps one enriched effects authority and disabled effects remain selectable.
- Legacy world-effect rendering is bounded to 64 active effects and 4,096 burst
  particles per frame; glow bursts use instancing instead of one mesh per cube.
- Effect Inspector controls are generated from the canonical VFX parameter
  schema for number, integer, boolean, color, and enum kinds. Metadata, defaults,
  bounds, units, runtime support, and deferred animation support are visible.
- Valid edits reuse the synchronized command/history path; invalid legacy values can
  be restored to their schema default while unknown finite legacy keys survive
  edits, save/reload, packages, undo, and redo.
- VFX color values are restricted to safe hex or named tokens at validation and
  renderer boundaries.
- Schema 10 embeds one validated native VFX record in each existing effect and
  persists native version, seed, transform, entity/bone target, parameters,
  local-frame parameter keyframes, blend, layer, and preview/export qualities.
- Project JSON, packages, autosave, history, and production package export
  preserve native VFX. Autosave retains a rollback copy, and schema 9 export
  fails explicitly when native-only data would be lost.
- One pure native prepared-frame contract now feeds Three.js world VFX, React
  overlays, PNG/sequence, composited WebM, and FFmpeg staging. Local parameter
  keyframes evaluate from effect-local time and missing targets emit warnings.
- Final render state applies the selected VFX flag before painting;
  `includeVfx=false` produces an empty prepared frame for every VFX layer.
- Shared frame preparation enforces pre-allocation global caps of 64 effects,
  4,096 particles, 8,192 segments, and 10,000 combined work units, with
  deterministic project-order allocation and structured diagnostics.
- Scene root rebuild/dispose recursively releases owned Three.js geometries,
  materials, textures, render targets, skeletons, instance buffers, and roots.
  Explicitly shared Minecraft materials and skin textures remain cache-owned.
- WebM capture releases image bitmaps, MediaStream tracks, and recorder listeners
  across normal export, repeated retry, cancellation, startup failure, and error.
- Effects command execution retains its public API but hostile input validation
  and project/native-VFX validation now have focused modules. All 41 command
  characterization tests pass unchanged after the extraction.
- A frozen Phase 16 built-in preset catalog joins metadata to existing effect
  and native definitions. The Effects Library consumes it directly.
- Catalog construction fails closed on corrupt records, duplicate IDs/definitions,
  invalid schema/duration/quality/category/tags, missing assets/localization,
  incompatible project schema, false stable claims, and excessive budgets.
- The 12 existing entries are compatibility/experimental, not falsely counted
  toward the 60 native stable preset target.
- A versioned native recipe layer composes the existing five primitive kinds.
  It validates, clones, freezes, and aggregate-budgets all descriptors before
  the global allocator permits primitive sample generation.
- Eight combat entries use that path and the existing schema 10 collection:
  combat sparks/impact, sword slash, parry, ground slam, landing dust, critical
  hit, and hit stop. Their parameters are live-preview editable and JSON/package
  persistence continues through the existing serializer and VfxRegistry view.
- Native world primitives render in the shared Three.js viewport/export canvas.
  Hit stop samples the animated pose at its start while preserving the global
  VFX/environment frame; excluding VFX from final export excludes the hold.
- One built-in recipe registry now resolves both combat and electric families.
  Eight electric presets cover strike, storm, beam, aura, charge, sparks, chain
  lightning, and a layered weapon trail with all exposed parameters live.
- Dense electric storm combinations are regression-tested against the shared
  segment cap and are rejected before geometry/sample allocation.
- Eight native fire/explosion presets add flame, smoke, layered explosion,
  embers, debris, dust, Nether fire, and soul fire using the same runtime.
- Eight native magic/energy presets add aura, beam, projectile, portal,
  teleport, heal, corruption, and power-up using all primitive kinds.
- Ten native environment presets add weather, atmosphere, dimension, cave, and
  firefly fields with catalog-declared Primitive V1 direction limitations.
- Eight native screen/cinematic presets share evaluated parameters across
  viewport and Canvas export: flash, shake, glitch, bars, bloom, vignette,
  freeze, and color drain.
- Ten native movement/trail presets cover dash, weapon, projectile, footsteps,
  running, falling, flying, Elytra, Ender pearl, and swimming. The catalog now
  contains 60 stable native recipes and 72 entries total.
- The Effects Library provides text search, category and cumulative tag filters,
  favorites, recents, and All/Built-in/Custom source views. Personal state is
  versioned and bounded in local storage, outside project serialization.
- All 60 native presets have deterministic generated SVG previews scheduled one
  idle task at a time and stored in a fail-soft versioned local cache. The 60
  pass stable eligibility/integration gates; 12 legacy entries remain non-stable.
- Four deterministic benchmark projects lock exact family, particle-cap,
  segment-cap, and balanced-dense allocation behavior through package reload.
- A dedicated VFX Studio creates blank drafts or immutable derived copies of all
  60 stable built-ins. Versioned authoring documents contain only bounded,
  structured-cloneable primitive, emitter, and restricted modifier stack data.
- Pure authoring commands edit stack order/content and duration/target/quality.
  Ordered tint/opacity/scale modifiers compile to deeply frozen, budgeted
  Primitive V1 descriptors and deterministic live SVG previews.
- Closed `.minemotion-vfx` manifest V1 and bounded in-memory ZIP32 extraction
  validate versions, IDs, licenses, dependencies, permissions, declared assets,
  PNG dimensions, authoring data, and compiled budgets while rejecting code,
  traversal, archive bombs, malformed ZIP metadata, and undeclared files.
- Canonical package writing sorts JSON/lists/entries, fixes ZIP timestamps, and
  self-validates before delivery. VFX Studio exports drafts and inspects package
  preview, work, licenses, permissions, assets, dependencies, and readiness
  without installing or mutating local state.
- A bounded versioned local registry reparses canonical archives on load and
  supports install, compatible update, enable, disable, inspect, and uninstall.
  Built-in IDs and enabled dependency graphs are protected; corrupt storage
  fails soft without deleting recoverable payloads.
- Closed asset handlers resolve bounded PNG, signed audio, box model, gradient,
  curve, localization, and parameter-only restricted shader data. JSON structure
  is bounded and unavailable templates explicitly use Primitive V1 material.
- Validated effects commands reuse cached adapted definitions and skip redundant
  one-record sanitation after whole-project validation. The 4,097-effect legacy
  repair regression improved from 17.6 s to 2.31 s with identical persistence.

## Partial Systems

- Known preset visuals still use a bounded compatibility map over prepared
  native frames; primitive V1 descriptors are not yet the visual renderer for
  every preset. This preserves appearance while runtime data is canonical.
- Blockbench auto-rigging, production IK, animated resource textures, secure plugin execution, native dialogs, and full NLA blending are not implemented.

## Absent Systems

- Phase 17 installed custom effect integration, examples, node-graph research,
  and author documentation remain.
- Full localization, advanced rig constraints, shot/take manager, plugin SDK/sandbox, AI assistance, and collaboration.
- A distinct completed Phase 13 premium polish release.

## Evidence

- 83 frontend test files and 382 passing tests.
- Typecheck/build/audit green.
- Cargo check and 2 Rust tests green.
- Tauri debug installers green; release profile blocked by host Smart App Control.
- FFmpeg codec execution unverified because FFmpeg is not installed locally.

## Architecture Checkpoint

- `ProjectFile.ts` still owns product schema but re-exports generic scene types
  from `src/core/scene`.
- `CURRENT_PROJECT_SCHEMA_VERSION` is the runtime source of truth for schema 10.
- Generated IDs are centralized; deterministic seeded IDs are a separate API.
- Existing effects remain preset-based. Phase 15 must adapt `effects.instances`
  and the existing effects timeline lane instead of adding parallel project data.
- Phase 15.1 keeps those legacy paths authoritative and exposes a derived,
  structured-cloneable VFX view. Project schema remains 9.
- Phase 15.2 evaluates frames without hidden state. Seed composition is
  versioned and typed; FPS and quality do not reshuffle the random stream, and
  a local frame can be evaluated in any order without reset or replay.
- Phase 15.3 caps every generated record family before allocation. Geometry is
  local to cloned placement data; quality adds stable indexed detail rather than
  rebuilding a different random stream.
- Phase 15.4 keeps `effects.instances` authoritative. Pure commands regenerate
  one effects lane and create one history checkpoint only for a real edit.
  Parameter keyframes remain deferred because schema 9 cannot represent them.
- Phase 15.5 derives Inspector behavior from those definitions rather than a
  copied UI schema. The controller validates known values and permits bounded,
  one-key repair of invalid schema 9 legacy data without accepting new unknown
  keys. Schema 10 persists native fields and local parameter keyframes.
- Phase 15.6 keeps one effects collection: the legacy projection remains active
  for current UI/rendering while a synchronized `nativeVfx` record is persisted.
  Schema 10 shared-field mismatches, malformed native data, and future versions
  fail closed.
- Phase 15.7 evaluates the synchronized native record for all preview/export
  preparation, safely resolves entity/bone references, and composes WebM from
  the same captured frames as PNG/FFmpeg. The legacy visual map remains until
  primitive parity is proven.
- Phase 15.8 budgets the shared prepared stack before any visual allocation and
  makes GPU ownership explicit. Rebuilds dispose owned resources once, while
  cache resources are marked shared and released only by their cache owner.
- Phase 15.9 preserves the effects controller API while separating validation
  ownership, and closes the phase with the complete configured gate green.
- Phase 17.1 layers a declarative authoring document over Primitive V1. Built-in
  callbacks are evaluated then cloned; functions and unrestricted shaders are
  absent, and no parallel effect collection or node graph is introduced.
- Phase 17.2 applies restricted modifiers as ordered transformations of earlier
  descriptors, then reuses Primitive V1 validation, evaluation, and budgets.
- Phase 17.3 uses a closed ZIP32 profile and keeps extraction as validated
  in-memory data; reading never implies installation or filesystem writes.
- Phase 17.4 makes package bytes canonical and keeps inspection a read-only
  boundary before any local registry mutation.
- Phase 17.5 stores canonical archives rather than partial reconstructed package
  state and revalidates all enabled dependency relationships on load.
- Phase 17.6 keeps package assets declarative and uses a real default-material
  fallback when a restricted built-in shader template is unavailable.
