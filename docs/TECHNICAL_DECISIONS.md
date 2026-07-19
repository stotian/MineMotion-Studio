# Technical Decisions

## TD-001 - Extend the current architecture incrementally

Status: Accepted

Keep project schema, timeline, renderer, and registries in place. Introduce contracts and adapters around them. A rewrite would endanger migrations and working phase behavior.

## TD-002 - Runtime capabilities are centralized and evidence-based

Status: Accepted

One core snapshot reports WebGL/WebGPU, canvas, WebM codecs, audio, Tauri, FFmpeg, filesystem, and plugin sandbox support. Existing public support helpers delegate to it so UI cannot drift into fake support.

## TD-003 - Scene contracts move to core through compatibility re-exports

Status: Accepted

Move stable transform/entity type ownership to `src/core/scene` while re-exporting from `ProjectFile.ts`. Existing imports remain valid and future engine services gain a lower-level contract.

## TD-004 - Schema version has one source of truth

Status: Accepted

Use a core schema constant/type in project interfaces, defaults, and serializer assertions. Schema changes still require explicit migrations and tests.

## TD-005 - Service interfaces are boundaries, not a DI framework

Status: Accepted

Define simple generic interfaces for scene, timeline, render, VFX, audio, assets, project, export, and plugins. Implement adapters only when a feature needs them.

## TD-006 - Existing effects will be adapted into Phase 15

Status: Accepted

Keep schema 9 `effects.instances`, `EffectRegistry`, and `track_effects_main`
authoritative while Phase 15 is introduced. A pure compatibility projection
adapts legacy definitions and instances into typed VFX contracts without
changing project serialization. Reverse conversion rejects rotation, scale,
bone target, seed, quality, blend, layer, or definition changes that schema 9
cannot represent instead of silently losing them.

This temporary dual type vocabulary is preferred over a parallel store/lane or
a premature schema 10 migration. Runtime consumers migrate incrementally; a
schema change requires its own tested migration milestone.

## TD-007 - Generated identity and render randomness are separate

Status: Accepted

Use `createId` for editor/project identity. Use explicit seeded deterministic
functions for frame evaluation. Never derive visible VFX randomness from wall
clock time, UUIDs, or uncontrolled `Math.random()`.

## TD-008 - Runtime support is a lazy immutable snapshot

Status: Accepted

Probe browser/native capabilities once per runtime snapshot and expose explicit
refresh when the host changes. FFmpeg codecs require supplied detection evidence;
the registry does not claim codecs merely because the application is in Tauri.

## TD-009 - VFX frame evaluation is stateless and counter-addressed

Status: Accepted

Evaluate a VFX frame only from its validated instance, definition, and explicit
frame/FPS/context-seed/quality inputs. Combine versioned, typed seed parts with
the existing stable 32-bit content hash, then address every pseudo-random sample
by a semantic stream and numeric index. Never share mutable PRNG state between
instances or calls.

This makes playback, scrubbing, frame stepping, backward seeks, undo, schema 9
reload, preview evaluation, and offline evaluation order-independent without a
reset API. Quality profiles may change deterministic budgets but must not change
the underlying random stream. Stateful native primitives must later preserve
this contract through semantic sample coordinates or an explicit replay layer.

## TD-010 - Native VFX primitives are bounded renderer-neutral data

Status: Accepted

Represent primitive configuration and evaluated output as versioned
discriminated unions. Validate every descriptor, clamp safe integer work budgets
before allocation, and dispatch to focused pure evaluators. V1 covers particle
emitter, beam, trail, expanding ring, and light pulse with caps of 1,024
particles and 256 beam/trail/ring subdivisions or segments.

Particle quality consumes a literal stable prefix. Beam, trail, and ring select
nested canonical sample indices so shared details and endpoints do not move as
quality rises. Seeds never include quality or evaluation order. Three.js,
Canvas, CSS, target resolution, mutable registries, and GPU ownership remain
outside the primitive contract and are deferred to later integration milestones.

## TD-011 - Effects timeline editing keeps schema 9 as the sole authority

Status: Accepted

Route every effects-lane edit through a pure validated command controller that
mutates `effects.instances`, then regenerate exactly one `track_effects_main`
lane. Sanitize and preserve foreign timeline lanes, but never treat effect-lane
items as independent persisted state. The React bridge creates one whole-project
history checkpoint only for a successful non-no-op mutation.

This preserves schema 9, save/package compatibility, deterministic ordering,
undo/redo, and the current renderer while providing real move, trim, duplicate,
copy/paste, enable, priority, delete, and Inspector editing. New growth above
4,096 instances is blocked, but oversized legacy projects remain repairable.
Parameter keyframes and other native-only VFX fields wait for the tested schema
10 migration instead of being encoded in an unofficial parallel contract.

## TD-012 - The VFX schema generates Inspector parameter behavior

Status: Accepted

Derive number, integer, boolean, color, and enum controls from the canonical
`VfxParameterSchema`, including labels, categories, units, bounds, steps,
defaults, animation metadata, and current runtime support. Do not maintain a
second UI parameter definition. Route committed changes through the schema 9
timeline controller so one successful non-no-op edit creates one whole-project
history checkpoint.

Known parameters are validated against their definition. Bounded finite unknown
legacy keys remain untouched, and an invalid known legacy value may be repaired
one key at a time. New unknown keys remain rejected. Colors must be safe hex or
alphabetic named tokens before reaching CSS, Canvas, or Three.js. Parameter
keyframes and native-only fields remain schema 10 work.

## TD-013 - Schema 10 enriches the single existing effects collection

Status: Accepted

Migrate schemas 1-9 to project schema 10 by attaching one validated `nativeVfx`
record to every existing `effects.instances` entry. Do not add `project.vfx`, a
second store, or a second lane. During the 15.6-to-15.7 bridge, current edits
synchronize identity, display name, inclusive timing, enabled state, position,
entity target, and parameters into the native record while preserving native
rotation/scale, target bone, seed, local parameter keyframes, blend, layer, and
qualities.

Current schema 10 loads require native data and reject corrupt/future versions
or shared-field disagreement. Schemas 1-9 migrate without mutating their source.
Browser autosave keeps a previous payload, packages delegate to the canonical
serializer, and schema 9 rollback is allowed only after guarded lossless reverse
conversion. The legacy projection remains until typed runtime parity in 15.7.

## TD-014 - Native prepared frames unify preview and visual export

Status: Accepted in Phase 15.7.

Evaluate each schema 10 `nativeVfx` record through one pure project-frame
preparation boundary with explicit frame, FPS, seed, quality, and inclusion.
Three.js world visuals, React overlays, PNG/sequence, WebM, and FFmpeg consume
that result. Final-camera state applies export visibility before painting, and
`includeVfx=false` returns an empty prepared frame without inspecting effects.

WebM records the same composited captured frames used by PNG/FFmpeg instead of
the raw viewport canvas. Existing preset visuals remain a bounded compatibility
map over typed evaluations until primitive render parity is proven. Missing
entity/bone targets warn and resolve to null rather than unsafe access.

## TD-015 - Global VFX work is budgeted at prepared-frame ownership

Status: Accepted in Phase 15.8.

Measure compatibility-renderer work where schema 10 frames become visual stack
entries, before Three.js or Canvas consumers allocate. Preserve stable project
order and cap each frame to 64 active effects, 4,096 particles, 8,192 segments,
and 10,000 combined stack work units. Keep requested/allocated diagnostics and
limit-hit counts on the transient prepared frame; do not persist budget state.

Renderer object trees own their geometries and non-cached materials/textures.
Recursive disposal deduplicates shared references and handles render targets and
skeletons. Module caches explicitly mark borrowed materials/textures as shared,
so reconstruction cannot dispose a resource that a later frame will reuse.

## TD-016 - Effects command execution and validation have separate ownership

Status: Accepted in Phase 15.9.

Keep `copyEffectTimelineBlock`, `applyEffectTimelineCommand`, command types, and
result contracts stable. Move plain-data/accessor/vector/patch validation into
an input validator and schema/timing/parameter/native-project checks into a
project validator. The controller remains the single command mutation and lane
synchronization boundary; no parallel effect architecture is introduced.

The existing characterization suite is the behavior contract. This extraction
does not change errors, paths, no-op semantics, history labels, cloning, order,
schema synchronization, or public imports.

## TD-017 - Built-in preset metadata joins existing definition authorities

Status: Accepted in Phase 16.1.

Keep legacy `EffectRegistry` and native `VfxRegistry` authoritative. Build one
read-only catalog by joining validated metadata to those definitions, freeze all
published views, and consume the catalog directly in the Effects Library.

Catalog validation fails closed for corrupt records, duplicate/mismatched IDs,
missing assets/localization, bad duration/quality/schema compatibility, false
stable claims, or work outside primitive/global budgets. Compatibility and
experimental entries never count toward the 60 stable-preset acceptance target.

## TD-018 - Built-in previews are deterministic data and personal cache is local

Status: Accepted in Phase 16.

Generate bounded SVG thumbnails from validated native primitive descriptors and
schedule one cache operation per idle task. Version cache keys with preset
metadata, fail softly when storage is missing/corrupt/full, and never persist
preview cache or favorites/recents inside project files.

Stable built-ins require a registered native recipe, current schema support,
editable preview/export capabilities, bounded work, localization, deterministic
all-quality evaluation, ready preview generation, and integration regressions.
Compatibility and experimental records remain visible but outside stable claims.
