# Phase 3

Phase 3 adds production output and project packaging on top of the Phase 2
cinematic editor.

## Delivered

- Project schema v4.
- Migration from schema v1/v2/v3 to schema v4.
- `.minemotion` package writer and reader.
- Package manifest and validation.
- Asset library index for OBJ, audio, and world summary metadata.
- Export settings model, validation, and presets.
- Export panel UI.
- Current frame PNG export.
- PNG sequence ZIP export with progress and cancellation.
- Browser WebM recording when `MediaRecorder` supports it.
- Browser WAV mixdown when `OfflineAudioContext` supports it.
- Render state snapshot/restore for frame exports.
- Performance monitor, resource tracker, and disposal helpers.
- Tests for package creation, export settings, ZIP writing, WAV encoding, render
  state restore, schema migration, and templates.

## Honest Limits

- `.minemotion` is currently a JSON package payload, not a compressed binary ZIP
  package.
- WebM records the live viewport canvas resolution.
- MP4 export is not implemented.
- Full offline shader compositing is not implemented.
- Native Tauri save/open dialogs are not wired.
