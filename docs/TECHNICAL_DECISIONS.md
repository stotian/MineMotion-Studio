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
