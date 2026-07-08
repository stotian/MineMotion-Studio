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

## Phase 2: Real World Import

- Read compressed `level.dat`.
- Parse NBT compounds fully enough for modern Minecraft worlds.
- Parse `.mca` region files and chunk sections.
- Decode block state palettes.
- Build chunk meshes from real blocks.
- Add region/chunk selection UI.
- Add chunk cache and bounded loading.
- Add basic greedy meshing.

## Phase 3: Minecraft Assets

- User resource-pack import.
- Block textures and UV mapping.
- Animated texture metadata.
- Item/entity asset registry.
- Material variants for water, glass, leaves, and emissive blocks.

## Phase 4: Advanced Rigs

- Steve and Alex presets.
- Custom skins.
- Selectable bones.
- Per-bone keyframes.
- Pose library.
- Walk-cycle generator.
- Blockbench `.bbmodel` import.
- Basic IK for arms and legs.

## Phase 5: Advanced Timeline

- Dopesheet.
- Simplified graph editor.
- Easing curves.
- Copy/paste keyframes.
- Markers.
- Animation layers.
- Camera cuts.

## Phase 6: Rendering And Export

- Render still images.
- PNG sequence export.
- Video export through ffmpeg.
- Camera render mode.
- Styled shadows.
- Motion blur approximation.

## Phase 7: Cinematic Tools

- Camera paths.
- Focus targets.
- Camera shake.
- Storyboard panels.
- Shot presets.

## Phase 8: Plugin System

- Custom importers.
- Custom rigs.
- Custom block definitions.
- Custom sky presets.
- Scripting hooks.
- Asset/template marketplace architecture.

