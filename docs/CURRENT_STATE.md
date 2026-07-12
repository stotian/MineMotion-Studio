# Current State

MineMotion Studio `0.8.2` uses project schema 9.

Phase 14 architecture consolidation and Phase 15 milestone 15.1 are complete.
The working product remains unchanged at the UI level; low-level contracts have
stable ownership under `src/core`, and a typed VFX compatibility projection now
exists without changing project schema 9.

## Working Systems

- React/Three.js editor shell, viewport, inspector, outliner, timeline, settings, templates, commands, autosave, and undo/redo.
- Minecraft Java world import MVP with bounded modern palette chunks.
- Steve/Alex rigs, skins, poses, bone tracks, animation presets, attachments, and static Blockbench geometry import.
- Resource pack/material/lighting studio MVP with atmosphere and environment keys.
- Timeline, Dopesheet, Graph view, markers, reusable clips, and NLA skeleton.
- Cinematic preset effects and post-processing preview/export overlays.
- `.minemotion`/`.mmsproj` save/load and migrations from schemas 1-8 to 9.
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

## Partial Systems

- Effects are still rendered by the preset-based legacy runtime. The typed VFX
  model exists, but deterministic evaluation, runtime state, and primitives do
  not yet exist.
- Blockbench auto-rigging, production IK, animated resource textures, secure plugin execution, native dialogs, and full NLA blending are not implemented.

## Absent Systems

- Phase 15.2+ deterministic VFX runtime, primitives, editor, serialization
  migration, and preview/export integration.
- Full localization, advanced rig constraints, shot/take manager, plugin SDK/sandbox, AI assistance, and collaboration.
- A distinct completed Phase 13 premium polish release.

## Evidence

- 54 frontend test files and 141 passing tests.
- Typecheck/build/audit green.
- Cargo check and 2 Rust tests green.
- Tauri debug installers green; release profile blocked by host Smart App Control.
- FFmpeg codec execution unverified because FFmpeg is not installed locally.

## Architecture Checkpoint

- `ProjectFile.ts` still owns product schema but re-exports generic scene types
  from `src/core/scene`.
- `CURRENT_PROJECT_SCHEMA_VERSION` is the runtime source of truth for schema 9.
- Generated IDs are centralized; deterministic seeded IDs are a separate API.
- Existing effects remain preset-based. Phase 15 must adapt `effects.instances`
  and the existing effects timeline lane instead of adding parallel project data.
- Phase 15.1 keeps those legacy paths authoritative and exposes a derived,
  structured-cloneable VFX view. Project schema remains 9.
