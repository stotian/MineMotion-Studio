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
