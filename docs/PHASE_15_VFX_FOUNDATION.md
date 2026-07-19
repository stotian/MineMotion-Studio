# Phase 15 - Native Deterministic VFX Foundation

Phase status: IN_PROGRESS
Milestones 15.1-15.6 status: COMPLETED and validated
Next milestone after checkpoint: 15.7 - native preview/export integration

## Requirements And Boundaries

Phase 15 must make VFX deterministic and first-class without replacing the
working project, timeline, renderer, history, or export paths. Schema 9
`effects.instances` and `track_effects_main` remain authoritative until a
schema 10 migration is designed and tested.

The first four milestones add pure typed contracts, definition/instance
validation, a derived registry view, a reversible legacy adapter, stable seed
derivation, counter-addressed randomness, pure frame evaluation, five bounded
renderer-neutral primitive kinds, and real effects-lane editing. They do not
claim schema-generated controls, parameter keyframes, serialization migration,
or preview/export parity yet.

Non-functional requirements:

- explicit frame, FPS, seed, and quality inputs;
- structured-cloneable instance data for undo/redo;
- no uncontrolled render randomness;
- no project schema change or duplicate timeline lane;
- unknown legacy parameters are preserved and reported;
- lossy conversion back to schema 9 is rejected;
- no GPU/runtime resource ownership in serialized contracts.

## Existing Integration Surface

- project data: `src/project/ProjectFile.ts` and `ProjectSerializer.ts`
- legacy definitions/instances: `src/effects/`
- timeline: `track_effects_main` through `CinematicTimeline.ts`
- undo/redo: whole-project structured clones through `commitProject`
- preview: `SceneRenderer.ts` plus DOM overlays in `Viewport.tsx`
- offline PNG: `src/export/RenderCapture.ts`
- production dispatch: `src/export/renderQueue/ProductionRenderExecutor.ts`
- plugin metadata: `src/plugins/PluginAPI.ts`

## Architecture Options

### A. Alias the legacy types (about 2-4 hours)

```text
EffectInstance ---> VfxInstance type alias ---> future runtime
```

Pros: almost no migration risk.
Cons: cannot model seed, quality, transform, layer, blending, or target bones;
validation remains weak.

### B. Extend `EffectInstance` in place (about 1-3 days)

```text
schema 9 JSON <--> expanded EffectInstance <--> every current consumer
```

Pros: one runtime shape immediately.
Cons: silently changes the effective schema, touches every consumer, and can
lose fields when old files are saved.

### C. Pure compatibility projection (selected, about 4-8 hours)

```text
schema 9 effects.instances
          |
          | pure non-mutating adapter
          v
    typed VfxInstance[] ---> registry + validator ---> future runtime
```

Pros: keeps current files, lane, UI, preview, export, autosave, packages, and
history stable while allowing the target model to be expressed and tested.
Cons: two type vocabularies coexist temporarily, and new-only fields cannot be
saved until schema 10.

## Milestone 15.2 Runtime Options

### A. Shared stateful simulation (about 4-8 hours)

```text
previous frame + mutable PRNG ---> next frame output
```

Pros: familiar particle-simulation model.
Cons: scrubbing, backward seeks, caller order, undo, and project reload can
change the result unless every hidden state transition is perfectly replayed.

### B. Replay from frame zero with caches (about 1-3 days)

```text
frame zero ---> replay all prior frames ---> requested frame
                    |
                    +-- optional mutable cache
```

Pros: can support stateful simulations deterministically.
Cons: expensive random seeks, complex cache invalidation, and unnecessary
runtime ownership before native primitives exist.

### C. Counter-addressed stateless evaluation (selected, about 6-10 hours)

```text
instance + definition + explicit frame/FPS/seed/quality
                            |
                            v
                 pure frame evaluation data
```

Pros: playback, scrubbing, stepping, preview, export, undo, and reload are
order-independent by construction; no reset API or hidden cache is required.
Cons: future stateful primitives must derive samples from semantic coordinates
or add an explicit, separately tested replay layer.

The seed contract is versioned and domain-separated. A project/context seed,
instance seed, definition ID, semantic stream, frame, and sample index are
combined unambiguously. Quality never changes the root random stream: higher
quality may consume a longer deterministic prefix without reshuffling samples
already visible at lower quality.

Milestone 15.2 deliberately returns only finite plain data. It does not resolve
scene targets, instantiate Three.js objects, mutate instances, read registries,
use wall-clock entropy, or migrate preview/export callers.

## Milestone 15.3 Primitive Options

### A. One evaluator per legacy effect (about 6-12 hours)

```text
legacy definition ---> effect-specific geometry data
```

Pros: quickest visual mapping for the 12 existing presets.
Cons: repeats particle/beam/ring behavior, preserves ignored-parameter drift,
and would become the parallel effect architecture Phase 15 must avoid.

### B. Renderer-owned primitive classes (about 2-4 days)

```text
VFX data ---> mutable Three.js/Canvas primitive objects ---> renderer
```

Pros: direct path to visible output and resource pooling.
Cons: couples evaluation to a host, introduces disposal/reset state before the
data contract is proven, and cannot be shared honestly by preview and export.

### C. Versioned renderer-neutral data union (selected, about 10-16 hours)

```text
validated active frame + primitive descriptor V1
                         |
                         v
              validate + cap budgets
                         |
                         v
              pure primitive output union
                         |
        +----------------+----------------+
        v                v                v
 future Three.js    future Canvas    future offline
```

Pros: one typed contract for every future consumer, deterministic tests without
a GPU, explicit allocation limits, and focused per-kind evaluators.
Cons: no visible product change in 15.3 and later renderer adapters must convert
plain points/scalars into host resources.

Selected V1 kinds are `particle-emitter`, `beam`, `trail`, `expanding-ring`,
and `light-pulse`. Screen overlays and camera modifiers remain the next useful
primitive additions, but are not required to prove this milestone.

Hard limits are runtime safety boundaries, not schema defaults:

| Budget/value | V1 hard limit |
| --- | ---: |
| particles per primitive | 1,024 |
| beam subdivisions | 256 |
| trail control points | 64 |
| trail segments | 256 |
| ring segments | 256 |

Safe integer work budgets above their cap produce a warning and are clamped
before allocation. Non-finite, fractional, negative, malformed, or physically
invalid configuration is rejected. Finite extreme coordinates are allowed, but
an evaluation that would produce a non-finite result fails before returning
data. Particle quality uses a literal prefix of stable sample indices. Beam,
trail, and ring use nested canonical indices so higher quality adds detail
without moving shared samples or endpoints.

## Milestone 15.4 Timeline Options

### A. Add a native VFX store and lane (about 2-4 days)

Pros: exposes the Phase 15 model directly.
Cons: creates two effect authorities, requires schema 10 prematurely, and risks
divergent history, preview, package, and export behavior.

### B. Edit timeline items independently (about 1-2 days)

Pros: small UI patch.
Cons: the lane becomes stale serialized state that can disagree with
`effects.instances`, especially after undo, reload, or package round-trip.

### C. Pure commands over schema 9 effects with a derived lane (selected,
about 2-4 days)

```text
UI intent ---> validated effect command ---> effects.instances
                                           |
                                           v
                              canonical track_effects_main
                                           |
                                           v
                              one HistoryStack checkpoint
```

Pros: one authority, deterministic mutations, backward-compatible files, real
undo/redo, and no second store/lane. Foreign timeline lanes are sanitized and
preserved around the canonical projection.
Cons: fields absent from schema 9, including parameter keyframes, cannot be
represented honestly and remain deferred to the tested schema 10 milestone.

## Milestones

1. **15.1 Model and compatibility** - typed definitions/instances/parameters,
   registry, validator, deterministic compatibility seed, legacy round-trip.
2. **15.2 Deterministic runtime** - seeded frame evaluator, reset/seek behavior,
   runtime state and deterministic tests.
3. **15.3 Native primitives** - at least five reusable primitives with hard
   limits and explicit ownership.
4. **15.4 Timeline integration** - reuse the effects lane; selectable blocks,
   drag/move, trim, duplicate, copy/paste, enable, priority, Inspector edits,
   scrubbing, save/reload, and history. Parameter keyframes require schema 10
   and are explicitly deferred to 15.6.
5. **15.5 Inspector and schemas** - generate real controls from parameter
   schemas and connect edits through project history.
6. **15.6 Serialization and migration** - schema 10 design, migration,
   round-trip/package/autosave tests, and rollback behavior.
7. **15.7 Preview and export** - one evaluation path for viewport, PNG, WebM,
   and native export with honest capability gates.
8. **15.8 Performance and cleanup** - pooling, caps, object-tree disposal,
   cancellation, diagnostics, and leak tests.
9. **15.9 Phase validation** - full acceptance review, docs, manual checks,
   install/typecheck/tests/build/audit/native validation as applicable.

## Milestone 15.1 Acceptance

- all nine legacy instance fields and every parameter key round-trip unchanged;
- all 12 built-in definition IDs, spaces, durations, defaults, and tags adapt
  from the existing registry rather than a copied preset dataset;
- timing remains inclusive at `startFrame + durationFrames`;
- compatibility seeds are stable and never use wall-clock or random entropy;
- registry rejects invalid or duplicate definitions;
- validator catches invalid IDs, timing, transforms, seeds, quality, parameter
  types/ranges, and missing definitions;
- unknown primitive legacy parameters are warned about and preserved;
- rotation, scale, bone, custom seed/quality/layer/blend changes are rejected
  when converting to schema 9;
- schema version remains 9 and the existing project/timeline/render/UI paths
  are unchanged;
- focused tests, full tests, typecheck, build, audit, and diff checks pass.

## Milestone 15.2 Acceptance

- the existing deterministic ID hash remains byte-compatible after its hash
  helper is shared with VFX randomness;
- hashing, sub-seed derivation, and counter-addressed random sampling have fixed
  regression vectors and reject invalid numeric coordinates;
- frame, FPS, context seed, quality, definition, and instance inputs are
  validated before evaluation;
- disabled, before-start, and after-inclusive-end states are explicit results;
- active output exposes absolute/local timing, progress, seconds, resolved
  parameters, root/frame seeds, a stable frame sample, and an explicit quality
  profile;
- timing remains inclusive through `startFrame + durationFrames`;
- output and validation data are structured-cloneable, JSON-safe, finite, and
  deterministically ordered;
- repeated, out-of-order, backward, cloned, undo-style, and schema 9 reload
  evaluations are byte-equivalent for identical explicit inputs;
- quality changes only the explicit `quality` and `qualityScale` fields and
  never reshuffles the seeded frame sample;
- no renderer, timeline, project schema, UI, or GPU integration is introduced.

## Milestone 15.3 Acceptance

- a versioned discriminated descriptor/output union covers the five selected
  renderer-neutral primitive kinds;
- every descriptor is validated before a loop or output allocation;
- particle, subdivision, and segment budgets obey documented hard caps and
  emit deterministic clamp warnings;
- particle output is a literal quality prefix and nested geometric sampling
  keeps shared beam/trail/ring sample IDs and values stable across qualities;
- all seed channels derive from the 15.2 root seed plus primitive ID/kind and
  never include quality, evaluation order, or wall-clock state;
- active frame placement is cloned; mutating an output cannot mutate its frame
  or descriptor input;
- repeated, reordered, cloned, and JSON-reloaded inputs are byte-equivalent;
- all successful outputs contain only finite plain data and survive both
  `structuredClone` and JSON round-trip;
- malformed/non-finite descriptors return typed validation failures without
  throwing;
- no Three.js, Canvas, CSS, renderer, timeline, project schema, UI, or export
  integration is introduced;
- focused tests, full tests, typecheck, build, audit, and diff checks pass.

## Milestone 15.4 Acceptance

- schema 9 `effects.instances` remains the sole effect authority and
  `track_effects_main` remains a derived lane;
- insert, edit, move, both trims, duplicate, copy/paste, enable/disable,
  priority reorder, selection, delete, and scrubbing perform real actions;
- drag/drop uses lane coordinates and preserves the grab offset even when CSS
  minimum width inflates a one-frame block;
- every successful edit creates exactly one history checkpoint; invalid and
  no-op commands create none, and undo/redo restores both source effects and
  their lane projection;
- committed numeric, vector, and color Inspector drafts preserve precision and
  are flushed before save/export;
- save/reload and `.minemotion` package round-trips preserve effect timing,
  order, names, enabled state, payloads, labels, and foreign lanes;
- controller, clipboard, effect, vector, parameter, and foreign-lane inputs are
  bounded plain data; sparse arrays, accessors, classes, non-finite values,
  duplicate IDs, and unsafe ranges fail deterministically;
- new growth beyond 4,096 effects is rejected, while oversized legacy schema 9
  projects remain editable and can be repaired without data loss;
- the legacy renderer clamps each burst to 1,024 particles, the active world
  stack to 64 effects and 4,096 particles per frame, and uses one instanced mesh
  for each glow burst;
- parameter keyframes are not faked in schema 9 and remain assigned to the
  schema 10 design in milestone 15.6;
- focused tests, full tests, typecheck, build, audit, and diff checks pass.

## Risks And Deferred Repairs

- `SceneRenderer.sceneRoot.clear()` detaches recreated effect geometry and
  materials without complete disposal. Target: 15.8.
- preview, PNG, and WebM currently render different subsets of effects and
  `includeVfx` cannot remove world VFX already present in the canvas. Target:
  15.7.
- target IDs are retained in pure primitive inputs but are not resolved against
  scene objects or bones. Target: 15.7.
- several legacy parameters are defined but ignored by render paths. Target:
  15.5/15.7.
- schema 10, independent persisted seeds, target bones, transform, quality,
  blend mode, and render layer remain deliberately unsaved in 15.1.

## Architecture Decision

Title: Preserve schema 9 through a pure legacy-to-VFX projection
Status: Accepted for milestone 15.1
Context: The target VFX model contains data schema 9 cannot represent while
current project, timeline, UI, preview, package, export, and history paths are
functional.
Decision: Keep legacy effects authoritative, derive typed VFX definitions and
instances through pure adapters, validate them, and reject lossy reverse
conversion.
Consequences: current projects remain safe and no competing store/lane is
introduced; runtime consumers migrate incrementally, while new-only VFX fields
must wait for a tested schema 10 migration.

Title: Evaluate VFX frames through counter-addressed stateless randomness
Status: Accepted for milestone 15.2
Context: Timeline playback, arbitrary scrubbing, offline rendering, undo, and
project reload must agree without relying on evaluation history.
Decision: Hash versioned typed seed parts with the existing stable 32-bit hash,
then sample a counter-addressed Mulberry32 mixer. Evaluate each frame as a pure
function of the instance, definition, and explicit context.
Consequences: no runtime reset is necessary and callers can evaluate frames in
any order. Stateful primitive behavior must later use semantic sample indices
or an explicit replay design; it cannot introduce a shared mutable PRNG.

Title: Represent native VFX primitives as a bounded renderer-neutral data union
Status: Accepted for milestone 15.3
Context: Existing effects duplicate a few shapes across Three.js, CSS, and
Canvas, while Phase 15 needs one deterministic path that future preview and
offline consumers can share.
Decision: Validate versioned primitive descriptors, clamp work budgets to hard
caps, and dispatch to focused pure evaluators that emit only plain finite data.
Use stable particle prefixes and nested canonical geometric sample indices.
Consequences: 15.3 creates no visible renderer change, but later adapters gain a
single safe input. Additional primitive kinds extend the union deliberately;
they do not register executable code or own GPU resources.

Title: Edit schema 9 effects through pure commands and a derived timeline lane
Status: Accepted for milestone 15.4
Context: The existing lane, project history, serializer, package format, UI,
and legacy renderer already depend on `effects.instances`. A separate native
collection or independently editable lane would create conflicting authority.
Decision: Validate a discriminated command union in a focused controller,
mutate only schema 9 effect instances, canonicalize foreign timeline data, then
regenerate exactly one `track_effects_main` lane. The UI submits one command and
creates one history checkpoint only when the command reports a real change.
Consequences: move/trim/duplicate/copy/paste/enable/priority/Inspector editing
now survive undo and reload without schema change. Native-only fields and
parameter keyframes remain impossible to persist until schema 10.

Title: Persist native VFX in one enriched schema 10 effects collection
Status: Accepted for milestone 15.6
Context: Native-only VFX data must survive project/package/autosave/history
before the typed renderer transition, while current visible behavior still
depends on the legacy effect shape.
Decision: Migrate schemas 1-9 to 10 by attaching one validated `nativeVfx`
record to each existing effect entry. Synchronize shared fields, preserve
native-only values, keep one collection/lane, reject corrupt/future data, retain
an autosave backup, and guard lossless schema 9 rollback.
Consequences: native version, seed, transform, targets, parameters/local
keyframes, blend, layer, and qualities persist without a parallel store. The
legacy projection remains a temporary runtime bridge until 15.7 proves parity.

## Milestone 15.1 Validation Record

- Schema impact: none; `CURRENT_PROJECT_SCHEMA_VERSION` remains 9.
- Project round-trip: PASS, including every legacy effect field.
- Focused tests: PASS - 6 files, 43 tests.
- Typecheck: PASS.
- Full tests: PASS - 54 files, 141 tests.
- Build: PASS - 1,759 modules; existing large-chunk warning remains.
- Audit: PASS - 0 vulnerabilities.
- Native/Tauri validation: not run; no Rust or native configuration changed.
- Manual visual validation: not required for this data-contract-only milestone.

## Milestone 15.2 Validation Record

- Schema impact: none; `CURRENT_PROJECT_SCHEMA_VERSION` remains 9.
- Hash compatibility: PASS; existing deterministic IDs retain fixed output.
- Random vectors: PASS for hash, typed seed derivation, uint32, and `[0, 1)`
  samples.
- Focused tests: PASS - 5 files, 46 tests.
- Typecheck: PASS.
- Full tests: PASS - 56 files, 160 tests.
- Build: PASS - 1,760 modules; existing large-chunk warning remains.
- Audit: PASS - 0 vulnerabilities.
- Native/Tauri validation: not run; no Rust or native configuration changed.
- Manual visual validation: not applicable; renderer/UI integration is
  deliberately deferred to milestone 15.7.

## Milestone 15.3 Validation Record

- Schema impact: none; `CURRENT_PROJECT_SCHEMA_VERSION` remains 9.
- Primitive kinds: PASS - particle emitter, beam, trail, expanding ring, and
  light pulse.
- Hard limits: PASS - 1,024 particles; 256 beam/trail/ring samples; 64 trail
  control points; over-budget safe integers clamp with warnings before loops.
- Quality invariants: PASS - particle prefixes and nested canonical beam/trail/
  ring sample identities remain stable across all four qualities.
- Adversarial validation: PASS - forged quality prototype keys, inherited/class/
  accessor/non-enumerable descriptors, sparse tuples, array subclasses, unsafe
  budgets, malformed frames, and non-finite output are rejected or normalized.
- Focused tests: PASS - 2 files, 28 tests.
- Typecheck: PASS.
- Full tests: PASS - 58 files, 188 tests.
- Build: PASS - 1,760 modules; existing large-chunk warning remains.
- Audit: PASS - 0 vulnerabilities.
- Native/Tauri validation: not run; no Rust or native configuration changed.
- Manual visual validation: not applicable; outputs are deliberately plain
  renderer-neutral data and visible integration remains milestone 15.7.

## Milestone 15.4 Validation Record

- Schema impact: none; `CURRENT_PROJECT_SCHEMA_VERSION` remains 9.
- Timeline/history/package round-trip: PASS, including disabled effects,
  canonical labels, foreign lanes, undo/redo, and oversized legacy repair.
- Adversarial validation: PASS for sparse arrays, inherited/class/accessor
  records, unsafe numeric ranges, unknown fields, duplicate IDs, malformed
  clipboard data, capacity boundaries, and ambient entropy guards.
- Focused tests: PASS - 8 files, 96 tests.
- Typecheck: PASS.
- Full tests: PASS - 62 files, 256 tests.
- Build: PASS - 1,769 modules; existing 1,050.38 kB large-chunk warning remains.
- Audit: PASS - 0 vulnerabilities.
- Native/Tauri validation: not run; no Rust or native configuration changed.
- Manual visual validation: BLOCKED_BY_ENVIRONMENT - the in-app browser could
  not attach to the local webview in two attempts. Drag coordinate and
  minimum-width behavior are covered by deterministic regression tests.

## Milestone 15.6 Validation Record

- Schema impact: `CURRENT_PROJECT_SCHEMA_VERSION` advances from 9 to 10.
- Migration: schemas 1-9 to 10 PASS, including legacy identity, inclusive
  timing, targets, parameters, invalid legacy repair, and special own keys.
- Persistence: project JSON, `.minemotion`, package v1/schema 9 input, browser
  autosave/backup, history undo/redo, and lossless schema 9 rollback PASS.
- Native contract: version, seed, transform, entity/bone target, parameters,
  local-frame keyframes, blend, layer, and qualities round-trip.
- Corruption: missing/future native data, future project/package versions,
  package mismatch, invalid keyframes, and shared-field divergence fail closed.
- Focused tests: PASS - 20 files, 200 tests.
- Full tests: PASS - 65 files, 298 tests.
- Typecheck/build/audit: PASS; existing large-chunk warning remains.
- Native/Tauri validation: not rerun because no Rust/native source changed.
- Manual visual validation: not applicable to this persistence-only milestone;
  the existing browser attachment environment limitation remains recorded.
