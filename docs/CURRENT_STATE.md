# Current State

MineMotion Studio `0.8.2` uses project schema 10.

Phase 14 architecture consolidation and Phase 15 milestones 15.1-15.6 are
complete. Low-level contracts have stable ownership under `src/core`, and a
typed VFX compatibility projection plus real effects-lane editing now coexist
with the schema 10 native persistence bridge.

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
- Foreign timeline lanes are canonicalized as bounded plain data, while schema 9
  effects remain the only authority and disabled effects remain selectable.
- Legacy world-effect rendering is bounded to 64 active effects and 4,096 burst
  particles per frame; glow bursts use instancing instead of one mesh per cube.
- Effect Inspector controls are generated from the canonical VFX parameter
  schema for number, integer, boolean, color, and enum kinds. Metadata, defaults,
  bounds, units, runtime support, and deferred animation support are visible.
- Valid edits reuse the schema 9 command/history path; invalid legacy values can
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

## Partial Systems

- Effects are still rendered by the preset-based legacy runtime. Timeline and
  Inspector edits use schema 9 instances, but the typed evaluator/primitive
  data are not yet the shared preview/export render path.
- Blockbench auto-rigging, production IK, animated resource textures, secure plugin execution, native dialogs, and full NLA blending are not implemented.

## Absent Systems

- Phase 15.7+ preview/export integration, resource cleanup, and final gate.
- Full localization, advanced rig constraints, shot/take manager, plugin SDK/sandbox, AI assistance, and collaboration.
- A distinct completed Phase 13 premium polish release.

## Evidence

- 65 frontend test files and 298 passing tests.
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
  keys. Schema 10 now persists native fields and local parameter keyframes;
  their typed visual evaluation remains deferred to 15.7.
- Phase 15.6 keeps one effects collection: the legacy projection remains active
  for current UI/rendering while a synchronized `nativeVfx` record is persisted.
  Schema 10 shared-field mismatches, malformed native data, and future versions
  fail closed. Typed runtime consumption becomes the exact 15.7 task.
