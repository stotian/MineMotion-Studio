# Plugin System

MineMotion Studio has a plugin-ready architecture. External JavaScript execution
is still disabled, but manifests, permissions, built-in plugins, and extension
points are modeled explicitly.

## Built-In Plugins

- `minemotion.builtin.templates`
- `minemotion.builtin.presets`
- `minemotion.builtin.cinematic-effects`
- `minemotion.builtin.obj-importer`

## Permissions

- `registerTemplates`
- `registerPresets`
- `registerEffects`
- `registerPostProcessing`
- `registerSfx`
- `registerRenderPresets`
- `registerTimelineItemTypes`
- `registerImporters`
- `registerExporters`
- `registerTools`

## Phase 2 Extension Points

Plugins can declare future support for:

- effects
- post-processing presets
- SFX metadata
- camera presets
- render presets
- timeline item types

## Security Boundary

External scripts are disabled in Phase 2. Future work needs a real sandbox,
trust model, crash isolation, capability-based API access, and installation
flow before third-party code can run.
