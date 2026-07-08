# Phase 1

Phase 1 establishes MineMotion Studio as a launchable MVP editor with a real
3D viewport, project model, timeline, and import architecture.

## Implemented

- Vite + React + TypeScript app.
- Tauri v2 scaffold under `src-tauri`.
- Dark editor layout inspired by Blender and Blockbench.
- Central Three.js viewport.
- Orbit/pan/zoom camera controls.
- Generated Minecraft-like terrain.
- Block palette and material system.
- Sky presets with lighting/fog changes.
- Default Minecraft character rig.
- Scene camera objects.
- Outliner with world, characters, cameras, OBJ objects, and lights.
- Inspector for object transforms.
- Add transform keyframes.
- Timeline playback and scrubbing.
- Project save/load as `.mmsproj`.
- World folder detection for `level.dat` and region folders.
- OBJ import using Three.js `OBJLoader`.
- Unit tests for serializer, interpolation, palette, and world scan.
- MIT license and documentation.

## Partially Implemented

- Tauri desktop app: scaffold exists. Native build was attempted and failed
  because Rust/Cargo were not available in the current environment.
- Minecraft world import: folder scanning and region filename/header helpers
  exist, but chunk/block parsing is not complete.
- NBT: a minimal uncompressed reader exists for future work; compressed
  `level.dat` reading is not wired into UI yet.
- OBJ materials: `.mtl` references are detected, but Phase 1 applies a neutral
  material.
- Rig animation: global character transform keyframes work; per-bone keyframes
  are prepared structurally but not exposed in the timeline UI.

## Not Implemented

- Full Anvil `.mca` parsing.
- Block state palette decoding.
- Greedy meshing.
- Resource-pack texture loading.
- Native Tauri dialogs.
- Render image/video export.
- Advanced timeline tools.
- Blockbench `.bbmodel` import.

## How To Test

Run:

```powershell
npm install
npm run build
npm test
```

Manual checks:

1. Start dev server with `npm run dev`.
2. Confirm the viewport shows block terrain and a character.
3. Use orbit/pan/zoom in the viewport.
4. Select a character in the outliner.
5. Change position/rotation/scale in the inspector.
6. Click `Add Keyframe`.
7. Move to a later frame, change position, add another keyframe.
8. Press `Play` and confirm interpolation.
9. Change sky preset and confirm the viewport color/light changes.
10. Save a project, load it again, and confirm scene data returns.
11. Select a Minecraft world folder and confirm the world summary updates.
12. Import a simple `.obj` and confirm it appears in the scene and outliner.

## Known Issues

- The production JS bundle is large because Three.js and example loaders are in
  the main chunk. Code splitting is a Phase 2/3 optimization.
- Tauri build requires Rust. In this environment, `npm run tauri:build` failed
  because `cargo` was not found.
