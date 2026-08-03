# Phases 22–25 local completion report

Date: 2026-07-29

Application: MineMotion Studio 0.8.2

Project schema: 10
Package schema: stored ZIP v1

## Scope result

All **54 numbered completion-pack tasks** assigned to Phases 22–25 have local
implementation evidence. This raises local progress from 111/298 after Phase 21
to **165/298 (55.37%)**. The authoritative GitHub baseline remains 90/298 until
these commits can be pushed and CI can run.

## Phase 22 evidence

| Requirement | Evidence |
|---|---|
| Shot identity, range, camera, state, notes, references, take/revision, outputs | `src/production/ShotTypes.ts`, `ShotManager.ts` |
| Takes, active/final state, reorder, bounded preview | `ShotManager.ts`, `ProductionWorkspacePanel.tsx`, `App.tsx` |
| Storyboard and typed markers | `ShotTypes.ts`, `src/animation/editor/Markers.ts` |
| Production validation | `ShotValidation.ts` |
| Deterministic folders/timecode/metadata | `ShotHandoff.ts` |
| Seven real renderer passes | `ExportTypes.ts`, `SceneRenderer.ts`, `RendererLayers.ts` |
| Persistent queue, recovery, retry and cancellation compatibility | `RenderJob.ts`, `RenderQueueStore.ts`, existing runners |
| Regression coverage | `ShotManager.test.ts` and runtime smoke checks |

Unsupported EDL/XML is intentionally not advertised. Depth and object-ID are
real host-owned override materials rather than fake placeholders.

## Phase 23 evidence

| Requirement | Evidence |
|---|---|
| Safe data packs vs logic plugins | `ExtensionTypes.ts`, `ContentPackValidator.ts` |
| SDK 1.0 and extension points | `packages/minemotion-plugin-sdk/src/index.ts` |
| Compatibility/dependencies/licenses/capabilities | `PluginCompatibility.ts`, manifests |
| Explicit trust and prohibited APIs | `PluginSecurity.ts`, `ExtensionManager.ts` |
| Worker/message sandbox | `PluginSandbox.ts` |
| Safe mode and failure isolation | `ExtensionManager.ts`, `useExtensionWorkspace.ts` |
| Local install/update/inspect/enable/uninstall/reload/logs | `ExtensionManager.ts`, `PluginManagerPanel.tsx` |
| Four examples/template/validator | `packages/minemotion-plugin-sdk`, `scripts/validate-extension-package.mjs` |
| Regression coverage | `ExtensionManager.test.ts` and manifest/runtime checks |

External executable extensions are not silently trusted and receive no
unrestricted filesystem, process, environment, secret, or native-eval access.

## Phase 24 evidence

| Requirement | Evidence |
|---|---|
| Primary/backup/history autosave and recovery UI | `ProjectAutosave.ts`, `src/recovery`, `RecoveryDialog.tsx` |
| Corrupt isolation, safe mode, resets | reliability/recovery hooks and settings UI |
| Redacted opt-in diagnostics | `src/diagnostics`, `SupportBundle.ts` |
| Accessibility modes and live status | settings types/defaults, `styles.css`, `App.tsx` |
| Native dialogs/recent paths/associations | `src/desktop`, Tauri config/capabilities |
| Real bounded ZIP plus legacy migration | `StoredZipReader.ts`, `PackageWriter.ts`, `PackageReader.ts` |
| CRC/path/duplicate/size/category safety | ZIP reader/writer tests and runtime checks |
| FFmpeg child cancellation | `FfmpegExportManager.ts`, `src-tauri/src/lib.rs` |
| Release channels/CI/docs/checklists | `src/release`, `.github/workflows/native.yml`, release docs |

Full native and installer acceptance remains an external gate because npm and
Rust dependencies cannot be installed in this recovery environment.

## Phase 25 evidence

| Requirement | Evidence |
|---|---|
| Candidate scoring and prerequisite analysis | `NEXT_GENERATION_PRIORITY_MATRIX.md` |
| One selected candidate only | `PHASE_25_RESEARCH.md` |
| Feature-flagged bounded prototype | `FeatureFlags.ts`, crowd generator and panel |
| Deterministic measurements | `CrowdBenchmark.ts`, benchmark script |
| Stable project unchanged until Apply | `CrowdPrototypePanel.tsx` |
| Weak candidates deferred | research and priority matrix |

The selected procedural-crowd prototype is capped at 80 characters. Promotion
to stable still requires real user-value and renderer-budget evidence.

## Verification summary

Passed in the recovery environment:

- TypeScript syntax and relative-import graph.
- English/French catalog parity and untranslated-JSX scan.
- architecture line ceilings.
- extension example validation.
- deterministic crowd budgets.
- shot/extension/ZIP/diagnostic/crowd runtime smoke checks.
- JSON manifests and Git diff integrity.

Unavailable or blocked:

- dependency-backed TypeScript/Vitest/Vite tests and production bundle;
- Cargo/Rust tests and installers;
- real FFmpeg/native/browser smoke matrix;
- GitHub push and remote CI.
