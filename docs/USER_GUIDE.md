# User Guide

This guide describes the Phase 2 editor workflow.

## Start The App

```powershell
npm run dev
```

Open the local Vite URL shown by the terminal.

## Add A Cinematic Effect

1. Move the timeline to the desired frame.
2. Use the **Effects** panel.
3. Click an effect such as **Lightning Strike**, **Impact Frame**, **Flash**,
   **Camera Shake**, **Speed Lines**, **Shockwave**, or **Glow Burst**.
4. Select the new timeline block.
5. Edit timing, position, color, alpha, radius, strength, or count in the
   inspector.
6. Press **Play** or scrub the timeline.

## Change Post-Processing

Use the **Post** section in the Effects panel to choose a preset such as
**Cinematic Warm**, **Dark Horror**, **Anime Impact**, **Retro Pixel**, or
**Noir**.

Use the inspector's **Post** section for numeric tuning.

## Use Render Preview

Click **Render Preview** in the top bar or Effects panel. The viewport switches
to a cinematic preview mode with active camera label, post-processing, effects,
and optional bars.

Render Preview is not full video export yet.

## Add SFX

Use **Import SFX** in the Effects panel for `.wav`, `.mp3`, or `.ogg` files.
You can also add built-in placeholder SFX such as Lightning Crack, Impact Hit,
Whoosh, Deep Boom, Camera Rumble, Magic Pulse, or Glitch Pop.

Audio clips appear on the timeline and trigger during playback.

## Select And Edit Objects

Use the outliner or viewport to select an object. The inspector can edit:

- name
- visibility
- locked state
- position
- rotation
- scale

Locked objects cannot be transformed, duplicated, or deleted.

## Use Presets

When a compatible object is selected, the inspector exposes:

- camera presets
- rig pose presets
- animation presets

Camera presets include wide, close-up, low angle, top-down, orbit, Dutch angle,
chase, over-shoulder, and dramatic zoom setups.

## Keyboard Shortcuts

- `Ctrl+P`: command palette
- `Ctrl+S`: save project
- `Ctrl+Z`: undo
- `Ctrl+Y`: redo
- `Ctrl+Shift+Z`: redo
- `Space`: play/pause
- `Ctrl+D`: duplicate selected object
- `Delete`: delete selected object or selected effect

## Save And Load

Use the top toolbar or `Ctrl+S` to download a `.mmsproj` file. Phase 1 and
Phase 1.5 projects are migrated to schema v3 when opened.

## Current Limits

- Real Minecraft chunk rendering is not implemented yet.
- Resource packs are not loaded yet.
- External plugin scripts are not executed yet.
- Native Tauri file dialogs are not wired yet.
- Full image sequence/video export is planned for a later phase.
