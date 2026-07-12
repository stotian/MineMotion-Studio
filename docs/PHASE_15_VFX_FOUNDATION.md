# Phase 15 - Native Deterministic VFX Foundation

Phase status: IN_PROGRESS
Milestone 15.2 status: COMPLETED - deterministic seeded frame evaluation
Next milestone after checkpoint: 15.3 - native VFX primitives

## Requirements And Boundaries

Phase 15 must make VFX deterministic and first-class without replacing the
working project, timeline, renderer, history, or export paths. Schema 9
`effects.instances` and `track_effects_main` remain authoritative until a
schema 10 migration is designed and tested.

The first two milestones add pure typed contracts, definition/instance
validation, a derived registry view, a reversible legacy adapter, stable seed
derivation, counter-addressed randomness, and pure frame evaluation. They do
not claim native primitives, inspector generation, or preview/export parity
yet.

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

## Milestones

1. **15.1 Model and compatibility** - typed definitions/instances/parameters,
   registry, validator, deterministic compatibility seed, legacy round-trip.
2. **15.2 Deterministic runtime** - seeded frame evaluator, reset/seek behavior,
   runtime state and deterministic tests.
3. **15.3 Native primitives** - at least five reusable primitives with hard
   limits and explicit ownership.
4. **15.4 Timeline integration** - reuse the effects lane; blocks, trim,
   duplicate, parameter animation, and scrubbing.
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

## Risks And Deferred Repairs

- `SceneRenderer.sceneRoot.clear()` detaches recreated effect geometry and
  materials without complete disposal. Target: 15.8.
- preview, PNG, and WebM currently render different subsets of effects and
  `includeVfx` cannot remove world VFX already present in the canvas. Target:
  15.7.
- target IDs are retained in pure primitive inputs but are not resolved against
  scene objects or bones. Target: 15.4/15.7.
- several legacy parameters are defined but ignored by render paths. Target:
  15.3/15.5/15.7.
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
