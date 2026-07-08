# Phase 1.5

Phase 1.5 is the productization pass between the first editor MVP and deeper
Minecraft import work. It keeps the Phase 1 architecture intact and adds the
editor systems needed for a real project workflow.

## Goals

- Add persistent app settings.
- Add per-project settings.
- Migrate project files from schema v1 to schema v2.
- Add starter scene templates.
- Add reusable presets for cameras, rigs, animations, palettes, and skies.
- Add a command palette.
- Add undo/redo and autosave.
- Add a plugin registry skeleton and plugin manager UI.
- Improve documentation and tests.

## Delivered Features

- App settings schema and serializer.
- Settings modal for app, viewport, editor, Minecraft, project, and plugin
  settings.
- Project schema v2 with `projectSettings`, object locking, visibility, and
  metadata.
- Serializer migration from schema v1 to schema v2.
- Built-in templates:
  - Empty Scene
  - Flat World
  - Character Animation
  - Cinematic Camera
  - Sunset Scene
  - Nether Mood
- Built-in presets:
  - camera framing
  - rig poses
  - animation tracks
  - block palettes
  - sky presets
- Command palette and keyboard shortcuts.
- History stack for undo/redo.
- Autosave snapshot and restore prompt.
- Plugin manifest, permission model, registry, loader skeleton, and plugin
  manager panel.
- Tests for settings, project migration, templates, presets, plugin registry,
  command registry, and history.

## Behavior Kept From Phase 1

- React + Three.js editor shell.
- Tauri v2 scaffold.
- Timeline playback and transform tracks.
- Project save/load.
- OBJ import.
- Minecraft world folder scanning.
- Demo block terrain.

## Boundaries

External plugin execution is not enabled yet. Phase 1.5 registers built-in
plugins and validates manifests, but it does not run arbitrary plugin scripts.

World import still scans folders and records metadata. Real Anvil chunk parsing
and block meshing remain Phase 2 work.

Native Tauri file dialogs and native packaging depend on Rust/Tauri
prerequisites being installed locally.
