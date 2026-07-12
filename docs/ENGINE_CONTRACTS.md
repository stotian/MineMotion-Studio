# Engine Contracts

Phase 14 introduces a small stable layer under the current editor without
replacing the project model, renderer, or React state.

## Ownership

| Contract | Owner | Notes |
| --- | --- | --- |
| generated and deterministic IDs | `src/core/ids` | Generated identity and seeded content identity stay separate. |
| frames and playback clocks | `src/core/time` | Pure helpers accept explicit FPS, ranges, and timestamps. |
| vectors, transforms, scene entities | `src/core/scene` | `ProjectFile.ts` re-exports these contracts for compatibility. |
| schema version, migrations, validation | `src/core/serialization` | Schema 9 has one runtime source of truth. |
| engine and user-facing errors | `src/core/errors` | Adoption is incremental at import/export boundaries. |
| runtime support | `src/core/capabilities` | Support is detected from evidence, never inferred from a visible button. |
| service boundaries | `src/core/services` | Interfaces guide extraction; there is no dependency injection container. |

## Capability Registry

`CapabilityRegistry` reports WebGL/WebGL2, experimental WebGPU, canvas image
capture, MediaRecorder, VP8/VP9/Opus WebM codecs, audio decoding, offline audio
mixdown, browser file pickers, Tauri, native filesystem access, FFmpeg evidence,
and plugin sandbox state.

FFmpeg support is false until native runtime detection supplies positive
evidence. External plugin execution remains disabled even if Web Workers exist;
a worker alone is not a secure plugin permission model.

Existing public helpers remain available:

- `isWebMExportSupported()`
- `isAudioMixdownSupported()`
- `isTauriRuntime()`

They now delegate to the registry so export validation and UI support messages
share the same probes.

## Compatibility Rules

- Keep `ProjectFile.ts` re-exports until imports are migrated naturally.
- Do not change `CURRENT_PROJECT_SCHEMA_VERSION` without a tested migration.
- Do not use generated IDs as deterministic render randomness.
- Do not make runtime service interfaces depend on React components.
- Add concrete service adapters only when extracting a real orchestration unit.
- Existing effects must be adapted into the Phase 15 VFX engine, not duplicated.

## Phase 15 Integration

The pure deterministic VFX evaluator accepts an explicit frame, FPS, quality
level, and context seed alongside a typed instance and definition. It returns
validated, structured-cloneable frame data without hidden state. Future service
and renderer adapters must reuse `effects.instances`, the effects timeline lane,
project serialization, viewport preview, offline export, and plugin extension
metadata described in `PHASE_14_ARCHITECTURE_AUDIT.md`.

Native primitive evaluators consume only a validated active frame and a V1
plain descriptor. They enforce local hard caps before allocation, use semantic
seed channels, and return a discriminated plain-data union. Renderer adapters
must treat these outputs as immutable input and own all host/GPU resources and
disposal outside project/history data.
