# MineMotion Studio

MineMotion Studio is a desktop-first cinematic Minecraft animation editor. The
goal is a focused creative tool for Minecraft-style scenes: build or import a
world, place blocky characters, animate cameras and rigs, use presets, and
prepare renders in later phases.

Phase 1.5 turns the Phase 1 MVP into a more product-shaped editor. It adds
settings, project migration, templates, presets, command discovery, undo/redo,
autosave, and a plugin-ready architecture while preserving the original React,
Three.js, and Tauri foundation.

## Current Version

- App version: `0.1.5`
- Project schema: `2`
- Settings schema: `1`
- License: MIT
- Repository: `https://github.com/stotian/MineMotion-Studio`

## What Works Now

### Editor Shell

- Dark desktop-style editor layout.
- Top toolbar, outliner, inspector, 3D viewport, timeline, and status bar.
- Dirty project indicator after unsaved edits.
- Help panel for shortcuts and current limitations.
- Responsive layout for smaller windows.

### Viewport And Scene

- Three.js viewport with orbit, pan, and zoom controls.
- Minecraft-like block terrain.
- Terrain presets: none, demo, flat, and nether.
- Sky presets: Day, Sunset, Night, Storm, Nether, End, and Custom Color.
- Camera helpers visible in the viewport.
- Selection outline for scene objects.
- Configurable grid, background, camera display, and render quality.
- Reset viewport / look through scene camera command.

### Project System

- `.mmsproj` save/load as JSON.
- Schema-versioned project files.
- Automatic migration from Phase 1 schema v1 projects to schema v2.
- Per-project settings:
  - project name
  - FPS
  - duration
  - default sky preset
  - terrain preset
  - render resolution preset
  - world source path
  - author
  - notes
- Scene objects now support visibility, locking, and metadata.

### App Settings

- Local app settings stored in the browser runtime.
- Autosave enable/disable and interval.
- Default project FPS, duration, and name.
- Viewport behavior settings.
- Editor preferences such as snap values, interpolation default, theme, and UI
  scale.
- Minecraft defaults such as sky, terrain size, block palette style, and
  resource pack path placeholder.
- Plugin preferences and disabled plugin IDs.

### Templates

Built-in starter templates are available from the template picker:

- Empty Scene
- Flat World
- Character Animation
- Cinematic Camera
- Sunset Scene
- Nether Mood

### Presets

Built-in preset libraries are available to the editor and plugin registry:

- Camera presets:
  - wide shot
  - close-up
  - low angle
  - top-down
  - orbit setup
- Rig pose presets:
  - idle
  - walk pose A
  - walk pose B
  - look left
  - look right
  - early placeholder action poses
- Animation presets:
  - walk cycle
  - camera push-in
  - camera orbit
  - head look-around
- Block palette presets:
  - classic
  - lush
  - nether
- Sky presets exposed through the preset registry.

### Animation

- Timeline playback and scrubbing.
- Configurable FPS and duration.
- Transform keyframes for position, rotation, and scale.
- Linear interpolation.
- Add keyframe for the selected object at the current frame.
- Preset animations can write starter tracks into the timeline.

### Objects And Assets

- Basic Minecraft character rig made from cubes.
- Scene cameras.
- Scene lights.
- Minimal OBJ import with neutral material.
- Minecraft world folder scan for `level.dat`, `region/*.mca`,
  `DIM-1/region/*.mca`, and `DIM1/region/*.mca`.

### Commands And Shortcuts

- Command palette with `Ctrl+P`.
- Save project with `Ctrl+S`.
- Undo with `Ctrl+Z`.
- Redo with `Ctrl+Y` or `Ctrl+Shift+Z`.
- Built-in commands for new/open/save-style flows, templates, settings, plugins,
  sky changes, adding objects, playback, keyframes, undo/redo, and viewport
  reset.

### Undo, Redo, And Autosave

- Undo/redo stack for project mutations.
- Autosave snapshot in local storage.
- Startup recovery prompt when an autosave exists.

### Plugin-Ready Architecture

- Plugin manifest type and validator.
- Plugin permissions model.
- Plugin registry with built-in plugin entries.
- Plugin loader skeleton.
- Plugin manager UI.
- Built-in plugins for templates, presets, and OBJ importer registration.
- External plugin JavaScript execution is intentionally disabled in Phase 1.5.

## Not Implemented Yet

- Full `.mca` chunk decoding and real block-state meshing.
- Real Minecraft texture/resource-pack loading.
- Per-bone keyframe editing in the UI.
- Skin import.
- Image/video export.
- Native Tauri file dialogs and filesystem commands.
- External plugin sandbox execution.
- Marketplace or plugin package installation.

## Tech Stack

- Tauri v2 shell scaffold
- React
- TypeScript
- Three.js
- Vite
- Vitest

Rust is required for a native Tauri build. If `cargo` is not available on the
machine, only the web frontend build can be verified.

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

Verified for Phase 1.5 on July 8, 2026:

- `npm run build` passed.
- `npm test` passed: 10 test files, 17 tests.
- `npm audit` passed with 0 vulnerabilities.
- Browser smoke test passed on `http://127.0.0.1:5173/`: editor UI loaded,
  Three.js viewport rendered, and console error log was empty.
- Native Tauri build was not verified on this machine because `rustc` and
  `cargo` were not installed.

## Tauri Desktop Commands

After installing Rust and the Tauri platform prerequisites:

```powershell
npm run tauri:dev
npm run tauri:build
```

On Windows, install Rust with `rustup`, then reopen the terminal so `cargo` is
available on `PATH`.

## Project Format

Project files use `.mmsproj` and are JSON. Current projects use
`schemaVersion: 2`:

```json
{
  "schemaVersion": 2,
  "appVersion": "0.1.5",
  "projectName": "Untitled MineMotion Project",
  "projectSettings": {
    "schemaVersion": 1,
    "projectName": "Untitled MineMotion Project",
    "fps": 24,
    "durationFrames": 300,
    "defaultSkyPreset": "Day",
    "worldSourcePath": null,
    "renderResolutionPreset": "1080p",
    "author": "",
    "notes": "",
    "terrainPreset": "demo",
    "blockPaletteStyle": "classic"
  },
  "sky": { "preset": "Day", "customColor": "#87bfff" },
  "world": null,
  "scene": {
    "characters": [],
    "cameras": [],
    "importedObjects": [],
    "lights": []
  },
  "assets": { "obj": [] },
  "animation": {
    "fps": 24,
    "durationFrames": 300,
    "currentFrame": 0,
    "isPlaying": false,
    "tracks": []
  }
}
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Phase 1](docs/PHASE_1.md)
- [Phase 1.5](docs/PHASE_1_5.md)
- [User Guide](docs/USER_GUIDE.md)
- [Settings](docs/SETTINGS.md)
- [Presets And Templates](docs/PRESETS_AND_TEMPLATES.md)
- [Plugin System](docs/PLUGIN_SYSTEM.md)
- [World Import Notes](docs/WORLD_IMPORT_NOTES.md)
- [Roadmap](docs/ROADMAP.md)

## Minecraft Assets And Legal Notes

MineMotion Studio does not bundle Minecraft textures, models, or proprietary
assets. Phase 1.5 uses generated color materials. Future resource-pack support
is planned so users can load assets they are allowed to use.

MineMotion Studio is not affiliated with Microsoft, Mojang, or Minecraft.

## License

MIT. See [LICENSE](LICENSE).
