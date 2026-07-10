# Architecture

MineMotion Studio is split into domain modules so cinematic tooling, real
Minecraft import, rendering/export, and future plugins can grow without a full
rewrite.

## Runtime Shape

```mermaid
flowchart LR
  UI["React UI"] --> AppState["App State"]
  AppState --> Project["Project Store"]
  AppState --> Settings["Settings Store"]
  AppState --> History["History Stack"]
  UI --> Commands["Command Registry"]
  UI --> Effects["Effects Registry"]
  UI --> Audio["Audio Manager"]
  UI --> Export["Export Panel"]
  UI --> Plugins["Plugin Registry"]
  Project --> Animation["Animation System"]
  Project --> Packages[".minemotion Package"]
  Project --> Post["Post Pipeline"]
  Project --> Renderer["Three.js Renderer"]
  Effects --> Renderer
  Post --> Viewport["Viewport Overlays"]
  Audio --> Timeline["Timeline"]
  Templates["Templates"] --> Project
  Presets["Presets"] --> Project
  Importers["World / OBJ / SFX / Blockbench Importers"] --> Project
  Rigs["Rig / Skin / Pose System"] --> Project
  Animation --> Renderer
  Tauri["Tauri Shell"] --> UI
```

## Modules

- `src/ui`: editor panels, modals, command palette, effects panel, settings,
  plugin manager, and help UI.
- `src/renderer`: Three.js viewport, camera controls, sky, grid, materials,
  terrain, scene rendering, and world-space effect preview.
- `src/rendering/postprocessing`: post-processing settings, presets, and
  overlay style pipeline.
- `src/rendering/export`: render state snapshot/restore and viewport frame
  export helpers.
- `src/export`: export settings, progress, PNG frame export, PNG sequence ZIP,
  and browser video support checks.
- `src/effects`: effect definitions, instances, registry, serializer, spawner,
  and timeline helpers.
- `src/audio`: audio clip types, import helpers, placeholder SFX registry,
  playback manager, serializer, and timeline helpers.
- `src/audio/export`: browser WAV mixdown and WAV encoding.
- `src/assets/library`: package asset records and asset library serialization.
- `src/minecraft`: block palette, terrain presets, world folder detection, NBT
  skeleton, and Anvil region helpers.
- `src/rigs`: Minecraft rig definitions, Steve/Alex presets, skin import/UV
  mapping, pose and animation presets, IK placeholders, and Blockbench import.
- `src/animation`: transform keyframes, timeline sampling, and interpolation.
- `src/project`: schema v8, serializer, migrations, package helpers, timeline
  sync, initial state, and object helpers.
- `src/performance`: FPS sampling, resource tracking, and disposal helpers.
- `src/plugins`: manifest, permissions, API shape, registry, loader, and
  built-in plugin metadata.
- `src-tauri`: Tauri v2 desktop shell scaffold.

## Project System

Project files use schema v8. The serializer migrates v1 through v7
projects by
adding:

- active camera
- render settings
- post-processing settings
- effect instances
- audio clips
- typed timeline lanes
- camera focal length/active flags
- package metadata
- asset library data
- export settings
- performance settings
- imported world chunk metadata
- rig presets, skin metadata, bone animation tracks, and Blockbench metadata

## Rendering

The renderer still uses a simple full scene rebuild strategy. Phase 2 adds
world-space VFX into the scene root:

- lightning bolt lines
- shockwave rings
- glow burst cube particles

Screen-space effects and post-processing are handled by React overlays around
the canvas. Phase 3 export captures those overlays through a canvas capture
path for PNG output and records the live viewport canvas for WebM where browser
support allows it.

## Timeline

The original transform tracks remain unchanged. Phase 2 adds `timelineTracks`
for typed lanes:

- transform
- effect
- audio
- postProcessing

Effect/audio lanes are synchronized from `effects.instances` and `audio.clips`.

## Audio

Imported browser audio files are stored as project clip metadata with data URLs.
Built-in SFX are placeholder descriptors and simple tone hooks, not bundled
copyrighted audio.

## Plugin Boundary

Plugin extension points now include effects, post-processing presets, SFX,
render presets, and timeline item types. External plugin JavaScript execution is
still disabled.
