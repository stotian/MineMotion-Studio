# MineMotion Studio

MineMotion Studio is a desktop-first cinematic Minecraft animation editor. It
combines a Minecraft-like scene viewport, character/camera animation, timeline
editing, cinematic VFX, SFX metadata, post-processing previews, and a Tauri
desktop scaffold.

Phase 3 adds the first production output layer: `.minemotion` project packages,
PNG still export, PNG sequence ZIP export, browser WebM recording where
supported, WAV audio mixdown where supported, export presets, an asset library
index, schema v4 migration, and performance support utilities.

## Current Version

- App version: `0.3.0`
- Project schema: `4`
- Settings schema: `1`
- Package format: `.minemotion` JSON package v1
- License: MIT
- Repository: `https://github.com/stotian/MineMotion-Studio`

## What Works Now

- Blender/Blockbench-style editor shell with outliner, effects panel, viewport,
  inspector, timeline, top bar, status bar, settings, plugins, templates,
  command palette, and export panel.
- Three.js viewport with Minecraft-like terrain, character rig, camera helpers,
  OBJ preview, sky presets, selection outline, and world-folder scan metadata.
- Project save/load as `.minemotion` packages with legacy `.mmsproj` JSON import
  and export.
- Migration from schema v1/v2/v3 projects to schema v4.
- App settings, autosave recovery, templates, presets, undo/redo, and plugin
  manager from earlier phases.
- Cinematic effects library with lightning, impact frames, camera shake, flash,
  speed lines, shockwave, glow burst, fog, vignette, color grade, cinematic
  bars, and explosion flash.
- Render Preview mode with active camera label, post-processing overlays, and
  cinematic bars.
- Timeline blocks for effects and audio clips.
- Basic SFX/audio support:
  - import `.wav`, `.mp3`, `.ogg`
  - built-in placeholder SFX descriptors
  - playback trigger during timeline preview
  - browser WAV mixdown through `OfflineAudioContext` where available
- Export pipeline:
  - current viewport frame as PNG
  - frame range as PNG sequence ZIP
  - WebM recording through browser `MediaRecorder` where available
  - legacy `.mmsproj` export for compatibility
- Export presets for 720p, 1080p, 1440p, vertical, square, cinematic 2.35:1,
  high-quality PNG sequences, and transparent PNG sequences.
- Asset library index for OBJ assets, audio clips, and world summary metadata.
- Blender-like shortcuts:
  - `Ctrl+P` command palette
  - `Ctrl+S` save `.minemotion`
  - `Ctrl+Z` undo
  - `Ctrl+Y` / `Ctrl+Shift+Z` redo
  - `Space` play/pause
  - `Ctrl+D` duplicate selected object
  - `Delete` delete selected object/effect

## Current Limits

- Full Minecraft `.mca` chunk decoding and real block-state meshing are not
  implemented yet.
- Real Minecraft texture/resource-pack loading is not implemented yet.
- Native Tauri file dialogs are not wired yet.
- `.minemotion` is currently a JSON package payload, not a binary ZIP archive.
- WebM export depends on browser `MediaRecorder` and records the live viewport
  canvas resolution.
- MP4 export requires a future FFmpeg/native pipeline.
- The final EffectComposer shader stack is represented by safe preview/export
  overlays, not a full offline compositor.
- External plugin JavaScript execution is still disabled.

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

## Project And Package Format

Current projects use `schemaVersion: 4`. The main save path downloads a
`.minemotion` file containing:

- package manifest
- schema v4 project JSON
- embedded OBJ model data
- embedded audio data URLs
- asset library metadata
- package warnings

Legacy `.mmsproj` JSON files remain loadable and exportable from the Export
panel.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Phase 3](docs/PHASE_3.md)
- [Export Pipeline](docs/EXPORT_PIPELINE.md)
- [MineMotion Format](docs/MINEMOTION_FORMAT.md)
- [Video Export](docs/VIDEO_EXPORT.md)
- [Audio Export](docs/AUDIO_EXPORT.md)
- [Performance](docs/PERFORMANCE.md)
- [Asset Library](docs/ASSET_LIBRARY.md)
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
