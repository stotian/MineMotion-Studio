# MineMotion Studio

MineMotion Studio is a desktop-first cinematic Minecraft animation editor. It
combines a Minecraft-like scene viewport, character/camera animation, timeline
editing, cinematic VFX, SFX metadata, post-processing previews, and a Tauri
desktop scaffold.

Phase 7 adds a production render queue, deterministic final-camera capture,
export preflight, browser PNG/WebM/WAV workflows, and a restricted desktop
bridge for user-installed FFmpeg. Phase 8 adds user-supplied resource packs,
Minecraft materials, biome tint, animated time of day, and Lighting Studio.
Phase 14 establishes the long-term engine foundation with stable scene/time/ID
contracts and evidence-based runtime capability reporting.

## Current Version

- App version: `0.8.2`
- Project schema: `9`
- Settings schema: `1`
- Package format: `.minemotion` JSON package v1
- License: MIT
- Repository: `https://github.com/stotian/MineMotion-Studio`

## What Works Now

- Blender/Blockbench-style editor shell with outliner, effects panel, viewport,
  inspector, timeline, top bar, status bar, settings, plugins, templates,
  command palette, and export panel.
- Three.js viewport with Minecraft-like terrain, imported Minecraft chunks,
  character rig, camera helpers, OBJ preview, sky presets, and selection outline.
- Project save/load as `.minemotion` packages with legacy `.mmsproj` JSON import
  and export.
- Migration from schema v1 through v9 projects to schema v10.
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
  - video-only WebM through browser `MediaRecorder` where available
  - selected-range WAV audio mixdown
  - persistent render queue with logs, cancellation, retry, and recovery
  - final camera position, rotation, FOV, and clipping settings
  - validation checklist and rough frame/duration/size estimates
  - H.264, H.265, ProRes, and MP3 through detected user-installed FFmpeg in Tauri
  - legacy `.mmsproj`, audio metadata, and `.minemotion` package jobs
- Export presets for draft 720p, YouTube 1080p/1440p, Vertical Shorts,
  cinematic 2.35:1, WebM, and PNG sequences.
- Asset library index for OBJ assets, audio clips, and world summary metadata.
- Real world import MVP:
  - folder scan through browser directory selection
  - `level.dat` parsing when gzip decompression is available
  - Overworld, Nether, and End region discovery
  - Anvil `.mca` region header parsing
  - selected chunk import around spawn or manual chunk coordinates
  - modern block state palette decoding
  - face-culling instanced mesh preview
  - chunk borders and world origin viewport helpers
- Professional character rig MVP:
  - Steve Classic and Alex Slim rig presets
  - bone-level selection from viewport and outliner
  - bone rotation editing and keyframes
  - pose library and rig animation presets
  - skin PNG import with 64x64 and legacy 64x32 validation
  - Minecraft skin UV mapping for core body parts
  - Blockbench `.bbmodel` static geometry import MVP
  - hand/head/back attachment point data
- Minecraft materials and lighting:
  - resource pack import from ZIP or browser folder selection
  - `pack.mcmeta` metadata and block PNG scanning
  - block texture resolution with generated-color fallback
  - texture atlas layout and browser canvas atlas builder
  - solid, transparent, leaves, water, glass, and emissive presets
  - nearest-neighbor Minecraft texture filtering
  - optional grass, foliage, and water biome tint placeholders
  - Lighting Studio with eight cinematic mood presets
  - sun, ambient light, shadows, fog, time-of-day, and post controls
  - environment keyframes on the Lighting & Sky timeline lane
- Professional animation editor:
  - Timeline, hierarchical Dopesheet, Graph Editor, and NLA views
  - keyframe multi-selection, drag, copy/paste, duplicate, delete, snap, and scale
  - constant, linear, easing, and Bezier-placeholder interpolation
  - named timeline markers
  - reusable animation clips and NLA-style clip stacking data
- Blender-like shortcuts:
  - `Ctrl+P` command palette
  - `Ctrl+S` save `.minemotion`
  - `Ctrl+Z` undo
  - `Ctrl+Y` / `Ctrl+Shift+Z` redo
  - `Space` play/pause
  - `Ctrl+D` duplicate selected object
  - `Delete` delete selected object/effect

## Current Limits

- Animated resource-pack textures are detected but not played yet.
- Per-face atlas rendering is prepared; the MVP applies one resolved texture
  to all faces of each instanced block material.
- Blockbench rig mapping is not automatic yet; Phase 5 imports static cube
  geometry as a preview object.
- IK solver math is prepared but not implemented.
- Import is intentionally bounded by max region files, max chunks, and max
  vertical sections.
- Tested assumptions target modern Java Edition Anvil worlds using palette-based
  chunk sections. Older pre-flattening chunk sections are not fully decoded.
- Browser decompression support is required for real gzip/zlib payloads.
- Native Tauri file dialogs are not wired yet.
- `.minemotion` is currently a JSON package payload, not a binary ZIP archive.
- WebM export depends on browser `MediaRecorder` and records the live viewport
  canvas resolution.
- Browser mode does not support MP4, H.265, ProRes, or MP3. Desktop export
  requires a user-installed FFmpeg executable and an existing output directory.
- WebM is video-only and uses live viewport resolution.
- Native cancellation is checked before FFmpeg starts; an active FFmpeg process
  runs to completion in the current MVP.
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

Current projects use `schemaVersion: 10`. The main save path downloads a
`.minemotion` file containing:

- package manifest
- schema v10 project JSON with validated native VFX data
- embedded OBJ model data
- embedded Minecraft skin data URLs
- embedded Blockbench raw JSON
- embedded resource-pack metadata and selected block texture PNG data
- embedded audio data URLs
- imported world metadata and optional imported chunk cache
- rig poses and bone animation tracks
- render queue history and FFmpeg settings
- asset library metadata
- package warnings

Legacy `.mmsproj` JSON files remain loadable. Schema 9 export is available when
the project contains no native-only VFX data that would be lost.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Phase 14 Architecture Audit](docs/PHASE_14_ARCHITECTURE_AUDIT.md)
- [Engine Contracts](docs/ENGINE_CONTRACTS.md)
- [Phases 14-25 Roadmap](docs/MASTER_ROADMAP_PHASES_14_25.md)
- [Phase Progress](docs/PHASE_PROGRESS.md)
- [Phase 5 Rigs](docs/PHASE_5_RIGS.md)
- [Skins](docs/SKINS.md)
- [Rigging](docs/RIGGING.md)
- [Blockbench Import](docs/BLOCKBENCH_IMPORT.md)
- [Animation Presets](docs/ANIMATION_PRESETS.md)
- [Phase 8 Materials And Lighting](docs/PHASE_8_MATERIALS_LIGHTING.md)
- [Phase 6 Animation Editor](docs/PHASE_6_ANIMATION_EDITOR.md)
- [Phase 7 Render And Export](docs/PHASE_7_RENDER_EXPORT.md)
- [Render Queue](docs/RENDER_QUEUE.md)
- [FFmpeg Export](docs/FFMPEG_EXPORT.md)
- [Export Formats](docs/EXPORT_FORMATS.md)
- [Dopesheet](docs/DOPESHEET.md)
- [Graph Editor](docs/GRAPH_EDITOR.md)
- [Animation Clips](docs/ANIMATION_CLIPS.md)
- [Resource Packs](docs/RESOURCE_PACKS.md)
- [Lighting Studio](docs/LIGHTING_STUDIO.md)
- [Phase 4 World Import](docs/PHASE_4_WORLD_IMPORT.md)
- [Minecraft World Format](docs/MINECRAFT_WORLD_FORMAT.md)
- [World Import Limitations](docs/WORLD_IMPORT_LIMITATIONS.md)
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
