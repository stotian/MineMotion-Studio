# MineMotion Studio

MineMotion Studio is a desktop-first cinematic Minecraft animation editor. It
combines a Minecraft-like scene viewport, character/camera animation, timeline
editing, effects, post-processing previews, and a Tauri desktop scaffold.

Phase 2 adds the first real cinematic production layer: VFX, SFX timeline
metadata, render preview mode, post-processing presets, timeline effect blocks,
and a safer schema migration path.

## Current Version

- App version: `0.2.0`
- Project schema: `3`
- Settings schema: `1`
- License: MIT
- Repository: `https://github.com/stotian/MineMotion-Studio`

## What Works Now

- Blender/Blockbench-style editor shell with outliner, effects panel, viewport,
  inspector, timeline, top bar, status bar, settings, plugins, templates, and
  command palette.
- Three.js viewport with Minecraft-like terrain, character rig, camera helpers,
  OBJ preview, sky presets, selection outline, and world-folder scan metadata.
- Project save/load as `.mmsproj` JSON with migration from schema v1/v2 to v3.
- App settings, autosave recovery, templates, presets, undo/redo, and plugin
  manager from Phase 1.5.
- Cinematic effects library:
  - Lightning Strike
  - Impact Frame
  - Camera Shake
  - Flash
  - Speed Lines
  - Shockwave
  - Glow Burst
  - Fog Pulse
  - Vignette Pulse
  - Color Grade Keyframe
  - Cinematic Bars
  - Explosion Flash
- Real visible effect playback:
  - world-space lightning, shockwave, and glow burst are rendered in Three.js
  - screen-space flash, impact, speed lines, fog, vignette, bars, and camera
    shake are rendered as viewport overlays
- Post-processing presets:
  - Clean Preview
  - Cinematic Warm
  - Dark Horror
  - Nether Heat
  - End Void
  - Anime Impact
  - Dream Glow
  - Stormy Contrast
  - Retro Pixel
  - Noir
- Render Preview mode with active camera label, post-processing overlays, and
  cinematic bars.
- Timeline blocks for effects and audio clips.
- Basic SFX/audio support:
  - import `.wav`, `.mp3`, `.ogg`
  - built-in placeholder SFX descriptors
  - timeline metadata and simple playback trigger during timeline playback
- Camera presets expanded with Dutch Angle, Chase Camera, Over The Shoulder,
  and Dramatic Zoom.
- Blender-like shortcuts:
  - `Ctrl+P` command palette
  - `Ctrl+S` save project
  - `Ctrl+Z` undo
  - `Ctrl+Y` / `Ctrl+Shift+Z` redo
  - `Space` play/pause
  - `Ctrl+D` duplicate selected object
  - `Delete` delete selected object/effect

## Not Implemented Yet

- Full Minecraft `.mca` chunk decoding and real block-state meshing.
- Real Minecraft texture/resource-pack loading.
- Native Tauri file dialogs.
- Full video export.
- Real EffectComposer shader stack for final export.
- External plugin JavaScript execution.
- Advanced graph editor, dopesheet, and per-bone animation UI.

## Install

```powershell
cd "C:\Users\stoti\Documents\Minemotion"
npm install
```

## Run In Development

```powershell
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://127.0.0.1:5173
```

## Build And Test

```powershell
npm run typecheck
npm test
npm run build
npm audit
```

Rust is required for native Tauri builds:

```powershell
npm run tauri:build
```

Do not treat the Tauri build as verified unless `rustc` and `cargo` are
installed and that command has completed successfully.

## Project Format

Current `.mmsproj` files use `schemaVersion: 3`. The serializer migrates older
Phase 1 and Phase 1.5 project files by adding:

- active camera
- effect instances
- audio clips
- post-processing settings
- render settings
- typed timeline lanes for transform, effects, audio, and post-processing

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Phase 2](docs/PHASE_2.md)
- [Cinematic Effects](docs/CINEMATIC_EFFECTS.md)
- [Post Processing](docs/POST_PROCESSING.md)
- [Audio SFX](docs/AUDIO_SFX.md)
- [Render Preview](docs/RENDER_PREVIEW.md)
- [Project Schema](docs/PROJECT_SCHEMA.md)
- [User Guide](docs/USER_GUIDE.md)
- [Plugin System](docs/PLUGIN_SYSTEM.md)
- [Roadmap](docs/ROADMAP.md)

## Minecraft Assets And Legal Notes

MineMotion Studio does not bundle Minecraft textures, models, sounds, or other
proprietary assets. Generated colors and placeholder SFX metadata are used for
the current MVP.

MineMotion Studio is not affiliated with Microsoft, Mojang, or Minecraft.

## License

MIT. See [LICENSE](LICENSE).
