# MineMotion Studio

MineMotion Studio is a desktop-first cinematic Minecraft animation editor. The
long-term goal is a focused Blender-like tool for Minecraft scenes: import a
world, place blocky characters, animate cameras and rigs on a timeline, choose
sky presets, import simple models, and export renders later.

Phase 1 is a real MVP foundation, not a full Blender replacement. It ships a
launchable React + Three.js editor with a Tauri desktop shell scaffold.

## Current Status

Implemented in Phase 1:

- Dark editor layout with top toolbar, outliner, inspector, 3D viewport, and
  timeline.
- Three.js viewport with orbit/pan/zoom controls.
- Minecraft-like demo terrain rendered with instanced block meshes.
- Block palette for grass, dirt, stone, oak log, oak leaves, water, glass, and
  air.
- Sky presets: Day, Sunset, Night, Storm, Nether, End, and Custom Color.
- Basic Minecraft character rig made from cubes.
- Scene cameras visible in the outliner and viewport.
- Transform inspector for position, rotation, and scale.
- Transform keyframes for selected objects.
- Timeline playback and scrubbing from frame 0 to 300 at configurable FPS.
- Project save/load as JSON `.mmsproj`.
- Minecraft world folder scan for `level.dat`, `region/*.mca`,
  `DIM-1/region/*.mca`, and `DIM1/region/*.mca`.
- Minimal OBJ import with neutral material.
- Tauri v2 scaffold for Windows-first desktop packaging.
- Unit tests for project serialization, interpolation, palette, and world scan.

Not implemented yet:

- Full `.mca` chunk parsing and block state meshing.
- Real Minecraft texture/resource-pack loading.
- Per-bone keyframes in the UI.
- Video/image export.
- Native Tauri file dialogs and filesystem commands.

## Tech Stack

- Tauri v2 shell scaffold
- React
- TypeScript
- Three.js
- Vite
- Vitest

Rust is required for a native Tauri build. The current machine used for Phase 1
did not have `rustc` or `cargo` available during implementation, so the verified
build is the web frontend build.

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
npm run build
npm test
```

Verified during Phase 1:

- `npm run build` passed.
- `npm test` passed: 4 test files, 7 tests.
- `npm audit` passed with 0 vulnerabilities.

## Tauri Desktop Commands

After installing Rust and platform prerequisites:

```powershell
npm run tauri:dev
npm run tauri:build
```

On Windows, install Rust from the official Rust installer or with `rustup`, then
reopen the terminal so `cargo` is on `PATH`.

## Project Format

Project files use `.mmsproj` and are JSON:

```json
{
  "schemaVersion": 1,
  "projectName": "Untitled MineMotion Project",
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

## Minecraft Assets And Legal Notes

MineMotion Studio does not bundle Minecraft textures, models, or proprietary
assets. Phase 1 uses generated color materials. Future resource-pack support is
planned so users can load assets they are allowed to use.

MineMotion Studio is not affiliated with Microsoft, Mojang, or Minecraft.

## License

MIT. See [LICENSE](./LICENSE).
