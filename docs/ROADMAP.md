# Roadmap

## Phase 1: Foundations And MVP

- Launchable editor shell.
- 3D viewport.
- Minecraft-like demo terrain.
- Basic rig.
- Timeline.
- Project save/load.
- World import skeleton.
- OBJ import.
- Documentation and tests.

## Phase 1.5: Productization And Presets

- App settings.
- Project settings and schema v2 migration.
- Templates and presets.
- Command palette.
- Undo/redo.
- Autosave.
- Plugin registry skeleton and plugin manager UI.

## Phase 2: Cinematic Editor Upgrade

- Cinematic effects.
- Post-processing presets.
- Render Preview mode.
- Timeline effect/audio blocks.
- Basic SFX import and placeholder SFX.
- Camera preset expansion.
- Project schema v3 migration.
- Plugin extension points for cinematic systems.

## Phase 3: Real Minecraft World Import

- Read compressed `level.dat`.
- Parse NBT compounds fully enough for modern Minecraft worlds.
- Parse `.mca` region files and chunk sections.
- Decode block state palettes.
- Build chunk meshes from real blocks.
- Add region/chunk selection UI.
- Add chunk cache and bounded loading.
- Add basic greedy meshing.

## Phase 4: Professional Render And Export

- Still image export.
- PNG sequence export.
- Video export through ffmpeg or native pipeline.
- Real EffectComposer/shader export stack.
- Camera render queue.
- Render settings presets.

## Phase 5: Advanced Rigs And Assets

- Steve and Alex presets.
- Custom skins.
- Per-bone keyframes.
- Pose library.
- Walk-cycle generator.
- Blockbench `.bbmodel` import.
- Resource-pack import.

## Phase 6: Advanced Timeline

- Dopesheet.
- Simplified graph editor.
- Easing curves.
- Copy/paste keyframes.
- Markers.
- Animation layers.
- Camera cuts.

## Phase 7: External Plugin System

- Plugin package format.
- Safe execution model.
- Custom importers.
- Custom rigs.
- Custom block definitions.
- Custom sky/effect/post presets.
- Asset/template marketplace architecture.
