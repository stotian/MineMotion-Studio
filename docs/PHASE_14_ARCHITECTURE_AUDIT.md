# Phase 14 Architecture Audit

Date: 2026-07-11
Baseline: `1e911af`, version `0.8.2`, project schema `9`

## Scope

This audit inspected repository structure, state ownership, project schema/migrations, timeline sampling, Three.js rendering, effects/post-processing, audio/assets, export/Tauri, plugin scaffolding, tests, documentation, and recent Git history.

It recommends incremental boundaries. It does not authorize a rewrite.

## Solid Foundations

### Domain-oriented folders

Animation, rigs, Minecraft import/resources/materials, lighting, effects, audio, export, project packaging, plugins, settings, templates, and UI already have recognizable ownership. New work should extend these areas rather than add a competing top-level architecture.

### Project migration discipline

`ProjectSerializer` supplies defaults and migrations from schemas 1-8 to schema 9. Serializer and package tests cover current and legacy projects. This is the strongest contract in the codebase and must remain the compatibility boundary.

### Registries and serializable presets

Effect, preset, template, command, and plugin registries already separate definition metadata from most UI. Phase 15 can build on this registry pattern.

### Animation editor models

Keyframe selection/commands/clipboard, interpolation, markers, reusable clips, and NLA data are modular and tested. Future VFX parameter tracks should reuse these primitives.

### Production export boundary

Render jobs, validation, deterministic frame stepping, frame/audio staging, and the restricted Tauri FFmpeg bridge are separated into focused modules. Browser/native capability differences are explicit.

### Test posture

The baseline has 46 frontend test files with 96 tests and 2 Rust tests. Serialization, registries, deterministic helpers, command builders, and migrations have direct coverage.

## Concentrated Responsibilities

| Module | Lines | Risk |
| --- | ---: | --- |
| `src/App.tsx` | 2636 | Main project state, imports, playback, autosave, every modal, command handlers, and export orchestration are coupled. |
| `src/ui/inspector/InspectorPanel.tsx` | 841 | Many domain inspectors share one component. |
| `src/ui/timeline/TimelinePanel.tsx` | 696 | Multiple editor modes and commands are composed together. |
| `src/ui/lighting/LightingStudioPanel.tsx` | 592 | Resource packs, lighting, post, and environment animation share one panel. |
| `src/ui/settings/SettingsModal.tsx` | 574 | Settings categories are not decomposed. |
| `src/project/ProjectSerializer.ts` | 497 | Migration/default logic is centralized but will become hard to extend indefinitely. |
| `src/ui/export/ExportPanel.tsx` | 490 | Format, FFmpeg, validation, direct actions, and queue presentation coexist. |
| `src/renderer/SceneRenderer.ts` | 423 | Scene synchronization, resource creation, picking, rendering, and effects share one class. |

These files should be split only along demonstrated domain boundaries. Large mechanical rewrites would increase risk.

## Duplicated Or Scattered Contracts

### IDs

ID generation appears in project, keyframe, marker, clip, NLA, asset, audio/effect serializers, and render queue modules. Several paths use `Math.random`. Editor-time IDs do not need deterministic visuals, but ownership and testability are inconsistent.

Recommendation: centralize generated ID formatting and inject deterministic seeds separately for future VFX. Do not confuse entity identity with VFX randomness.

### Scene types

`ProjectFile.ts` owns generic vector, transform, scene entity, and entity-type contracts alongside product-specific project schema. Renderer, animation, assets, rigs, plugins, and UI import this high-level module.

Recommendation: move stable scene contracts into `src/core/scene` and re-export them from `ProjectFile.ts` for compatibility.

### Schema version

The current schema literal is repeated in project interface, store, serializer, tests, docs, and package metadata.

Recommendation: use one core current-version constant/type in runtime code. Tests/docs should still assert explicit expected values.

### Runtime capability checks

WebM, OfflineAudioContext, Tauri, FFmpeg, and canvas support are checked in separate modules and repeated in UI/validation.

Recommendation: introduce a centralized immutable capability snapshot. Preserve existing helper APIs as delegating adapters.

### Error shape

Most modules throw plain `Error` strings. Export has specialized FFmpeg errors, while imports, serialization, assets, and plugins use unrelated formats.

Recommendation: define engine/user-facing error codes and adopt them incrementally at boundaries, not through a giant conversion.

## Missing Service Boundaries

There is no dependency-injection requirement, but explicit interfaces are missing for scene, timeline, render, VFX, audio, assets, project, export, and plugins. `App.tsx` calls concrete modules directly and supplies many callbacks.

Recommendation: define small generic service contracts now. Add concrete adapters only when extracting an orchestration unit. Avoid a container or reflection framework.

## Serialization Risks

- `MineMotionProject` is a broad object with many optional historical fields normalized in one serializer.
- Future VFX data could make `ProjectSerializer` larger unless migration steps become focused functions.
- Unknown future fields are not guaranteed to round-trip if sanitizers reconstruct nested structures.
- Render queue output paths are machine-local metadata inside portable projects.
- Embedded data URLs and resource textures can make JSON packages large.
- Some legacy sanitizer fallbacks generate fresh random IDs, making repeated parsing differ when IDs are absent.

Mitigation order:

1. Central schema/version and validation contracts.
2. Per-version migration functions when schema 10 is introduced.
3. Deterministic fallback IDs for serialized legacy objects where practical.
4. Explicit portable versus local-only metadata policy.
5. Package size validation and future binary/ZIP packaging research.

## Rendering And Performance Risks

### Full project cloning

`Animator.sampleProject` uses `structuredClone(project)` whenever tracks exist, then mutates the clone per track. Large embedded worlds/assets amplify frame cost.

### Scene rebuilds

`SceneRenderer.renderProject` rebuilds the scene root. Imported OBJ text is reparsed and materials/geometry are recreated. Resource disposal ownership is not consistently visible at this boundary.

### Export memory

PNG sequence ZIP holds every frame byte array in memory before writing the archive. Large ranges/resolutions can exceed browser memory before the current rough size warning.

### Effect construction

Current world effects create new Three.js geometry/material objects during scene rebuilds. Phase 15 should define runtime pooling/disposal from the start.

Recommended order:

1. Add diagnostics before optimization.
2. Separate scene synchronization from render loop.
3. Cache parsed/static assets and dispose owned GPU resources.
4. Sample only animated data rather than cloning embedded assets.
5. Stream native frame staging; research chunked ZIP output for browser mode.

## VFX Integration Points

Future VFX must connect to existing paths:

- project data: `effects.instances`
- definitions: `EffectRegistry`
- timeline lane: `track_effects_main`
- selection/inspector: selected effect ID and `InspectorPanel`
- viewport world effects: `SceneRenderer.createWorldEffectObject`
- screen effects: `Viewport.tsx`
- offline overlays: `RenderCapture.ts`
- render jobs: `ProductionRenderExecutor`
- package/migration: `ProjectSerializer` and package writer
- plugins: `PluginExtensionPoints.effects`

Phase 15 should provide an adapter/migration for current effect instances and reuse one effects/VFX lane. It must not introduce an unrelated second system.

## Plugin Boundary

The plugin registry validates built-in and external manifests. External code execution is explicitly disabled, which is correct. Current extension point types are mostly arrays of core definitions or placeholder strings.

Before executable plugins:

- separate safe content packs from logic plugins
- version the API
- use explicit permissions/capabilities
- validate messages across a worker/native boundary
- keep filesystem/process/API-key access unavailable by default

## Recommended Incremental Refactors

### Milestone 14.1

- Add repository and external continuation memory.
- Move stable scene contracts behind compatibility re-exports.
- Centralize current schema version.
- Add ID/time/error/validation contracts.
- Add centralized runtime capability snapshot and delegate existing support helpers.
- Define lightweight service interfaces.

### Later Phase 14 milestones

- Extract export orchestration from `App.tsx` into an application controller/hook.
- Extract import orchestration by domain when modified.
- Add focused migration-step functions before schema 10.
- Document ownership/disposal for renderer-created resources.

### Explicitly Deferred

- Replacing React state with a new global store.
- Rewriting Three.js renderer or timeline.
- Branded IDs across every serialized type in one change.
- Full VFX engine work before Phase 15.
- Plugin execution or a DI container.

## Phase 14 Acceptance Mapping

- Architecture audit: this document.
- Core contracts: `src/core/` with compatibility adapters.
- Capability registry: centralized and tested.
- Service boundaries: documented TypeScript interfaces.
- Integration points: VFX/render/timeline/project paths listed above.
- Current features: protected by full build/tests and schema migration tests.
