# User Guide

This guide describes the current Phase 1.5 editor workflow.

## Start The App

```powershell
npm run dev
```

Open the local Vite URL shown by the terminal.

## Create A Scene

Use **Templates** in the top toolbar to start from one of the built-in scenes:

- Empty Scene
- Flat World
- Character Animation
- Cinematic Camera
- Sunset Scene
- Nether Mood

Creating a template replaces the current project. Save important work first.

## Select And Edit Objects

Use the outliner or viewport to select an object. The inspector can edit:

- name
- visibility
- locked state
- position
- rotation
- scale

Locked objects cannot be transformed from the inspector.

## Use Presets

When a compatible object is selected, the inspector exposes preset buttons:

- camera presets for scene cameras
- rig pose presets for characters
- animation presets for characters and cameras

Animation presets add starter tracks to the timeline.

## Animate

Move to a frame on the timeline, select an object, adjust its transform, and use
the keyframe action. The current system supports transform tracks:

- `transform.position`
- `transform.rotation`
- `transform.scale`

Playback samples these tracks with linear interpolation.

## Save And Load

Use the top toolbar or `Ctrl+S` to download a `.mmsproj` file. Use the load
control to open an existing project.

Phase 1 project files using schema v1 are migrated to schema v2 when opened.

## Autosave

Autosave stores a local recovery snapshot. If a snapshot exists on startup, the
app asks whether to restore it.

Autosave is not a replacement for downloading `.mmsproj` files.

## Command Palette

Open the command palette with `Ctrl+P`. It can run project, object, animation,
viewport, settings, plugin, and sky commands.

## Keyboard Shortcuts

- `Ctrl+P`: command palette
- `Ctrl+S`: save project
- `Ctrl+Z`: undo
- `Ctrl+Y`: redo
- `Ctrl+Shift+Z`: redo

## Current Limits

- Real Minecraft chunk rendering is not implemented yet.
- Resource packs are not loaded yet.
- External plugin scripts are not executed yet.
- Native Tauri file dialogs are not wired yet.
- Render export is planned for a later phase.
