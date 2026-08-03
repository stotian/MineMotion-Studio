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
contracts and evidence-based runtime capability reporting. Phases 15-20 add
native deterministic VFX authoring, advanced rigging/animation workflows,
renderer ownership and culling, bounded resource pools, worker-based Minecraft
chunk decoding, stale-safe cancellable world import, and focused project/export
workspace controllers that keep `App.tsx` as a smaller composition root,
characterized timeline view extraction, advisory performance diagnostics,
reproducible large-scene fixtures, and executable regression ceilings. Phase 21
adds production-bounded modern world importing, per-face/animated resource-pack
materials, deterministic weather and dimension moods, read-only scene staging,
and versioned portable chunk caches. Phases 22-25 add shot/take/storyboard production management, real production passes and deterministic handoff metadata, a secure SDK 1.0 extension boundary, recovery/accessibility/native hardening with real ZIP packages, and one measured feature-flagged procedural-crowd experiment. Phases 26-35 add premium persistent workspaces, a professional portable asset pipeline, frame-accurate audio handoff, eight aligned render passes, deterministic simulations, legal templates/tutorials, onboarding/accessibility/developer documentation, honest cross-platform release engineering, public-beta QA matrices, and a fail-closed v1 release gate. Phases 36-83 add a versioned Ultra production foundation for acting, retargeting, locomotion, camera direction, Minecraft entities, non-destructive set work, deterministic simulation, cinematic materials, lighting, volumetrics, node VFX/compositing, and color management. Phases 84-135 add dedicated offline-render, modeling, animation-editing, editorial and production-workflow engines. The generated Phase 136-600 roadmap adds explicit versioned capability contracts executed by 31 specialized program engines, with deterministic plans, budgets, fallbacks and acceptance IDs across 31 additional programs. These Ultra systems remain source-level foundations with explicit artistic, native and hardware evidence gates; they are not presented as film-proven final tools yet. Phases 601–715 add a separate Minecraft Director milestone made only of artist-facing, distinct functions: shot recipes, generated sequences, camera-cut playback, shot editing, looks, choreography, Minecraft actions, scripted dialogue, cinematic beats/events, transitions, environment changes, layered sound design, group blocking, preflight/repair and production-document export. Phases 716–814 add Studio Pro cameras, persistent take review/versioning, batch operations, real rendered light rigs, animation polish, continuity tools, studio render-queue orchestration, six-department quality control and non-destructive shot creative variants for camera/lighting/post/render decisions. Phases 815–1014 add the Minecraft Creation Suite: bounded seed/save worlds, Vanilla/Fabric/Forge/NeoForge/Quilt project targets, safe mod-asset binding, non-destructive building, voxel modeling, ready-made and auto-generated rigs, synchronized multi-rig animation, optional collisions, Minecraft VFX, post stacks, target-device optimization and portable production packages. The registry is executable and each phase has a unique source owner and acceptance ID.

## Current Version

- App version: `0.8.2`
- Project schema: `10`
- Settings schema: `2`
- Package format: `.minemotion` stored ZIP schema 1 (historical JSON packages migrate)
- License: MIT
- Repository: `https://github.com/stotian/MineMotion-Studio`
- Release status: **`V1_BLOCKED`** — source-level completion is 285/298 tasks; no v1 tag, installer or platform support claim exists yet.

## What Works Now

- Blender/Blockbench-style editor shell with outliner, effects panel, viewport,
  inspector, timeline, top bar, status bar, settings, plugins, templates,
  command palette, and export panel.
- Three.js viewport with Minecraft-like terrain, imported Minecraft chunks,
  character rig, camera helpers, OBJ preview, sky presets, and selection outline.
- Project save/load as `.minemotion` packages with legacy `.mmsproj` JSON import
  and export.
- Migration from schema v1 through v9 projects to schema v10.
- App settings, templates, presets, and plugin manager from earlier phases.
- One project workspace controller owns project state, dirty confirmation,
  autosave recovery, package/legacy persistence, recent projects, and undo/redo.
- Cinematic effects library with lightning, impact frames, camera shake, flash,
  speed lines, shockwave, glow burst, fog, vignette, color grade, cinematic
  bars, and explosion flash.
- Native schema 10 VFX with deterministic frame evaluation, 60 stable built-in
  recipes, safe package authoring/import, localized library controls, and one
  shared preview/export preparation path.
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
- Professional shot production:
  - shots, takes, revisions, active/final states and bounded shot preview
  - lightweight storyboard cards and typed production markers
  - beauty, alpha, world, characters, VFX, depth, normals and object-ID passes
  - deterministic handoff folders, numbered frames, FPS, timecode and metadata
- Secure local extension system:
  - data-only content packs and capability-gated worker logic plugins
  - SDK 1.0, compatibility/dependency checks, trust, safe mode and bounded logs
  - four validated examples plus a development template/validator
- Reliability and desktop hardening:
  - primary/backup/history autosave and accessible startup recovery
  - redacted opt-in support bundles and accessibility display modes
  - bounded stored-ZIP projects with legacy JSON migration
  - restricted native dialogs, associations, recent-file hints and FFmpeg cancellation
- Experimental frontier:
  - deterministic procedural crowds behind a feature flag, capped at 80 actors
- Ultra production foundation and master roadmap (Phases 36–600):
  - persistent performance, directing, entity, world/simulation, rendering and VFX records
  - deterministic domain engines with phase-specific validation and dependency warnings
  - physical camera, contact, locomotion, crowd, destruction, redstone and battle contracts
  - cinematic material, light-linking, volumetric, sky, VFX graph, compositing and color contracts
  - Production workspace controls plus exact schema-10 save/reopen migration
  - `npm run verify:ultra` acceptance gate with 565 phase tests, 52 dedicated Phase 84–135 foundation tests, 1,263 top-level assertions and 7,986 internal phase-contract assertions
  - reproducible Phase 84–600 instructions in `docs/ULTRA_MASTER_PLAN_PHASES_84_600.md` and `npm run verify:ultra-roadmap`
- Minecraft Director, Studio Pro and Minecraft Creation Suite — real functional phases 601–1014:
  - 14 camera-shot recipes with generated camera entities and animated position/rotation tracks
  - dialogue, action and showcase sequence builders with storyboard and Camera Cuts synchronization
  - runtime camera switching, gap/overlap/coverage analysis, split, duplicate-take, retime, move, close-gap and ripple-delete editing
  - nine one-click film looks, automatic casting and a complete guided film starter
  - actor choreography, two-actor combat/walk-and-talk, 11 Minecraft-native actions and six crowd formations
  - script-to-scene dialogue with timing, muted recording placeholders, lip-sync cues, acting and alternating camera coverage
  - eight narrative beats, eight combined cinematic events, five transitions and four camera-path operations
  - six animated environment transitions and seven three-layer sound-design recipes
  - fail-closed project preflight/repair plus CSV shot list, EDL, storyboard, dialogue script and JSON manifest export
  - `npm run verify:director` requires all 414 unique acceptance IDs to execute; canonical mappings: `docs/DIRECTOR_REAL_PHASES_601_715.md`, `docs/DIRECTOR_STUDIO_PRO_PHASES_716_814.md` and `docs/MINECRAFT_CREATION_SUITE_PHASES_815_1014.md`
  - Studio Pro adds physical lens metadata and camera moves, take ratings/favorites/rejections/revisions, comparison and batch tools, eight bounded scene-light rigs, continuity repair and animation polish.
  - The shared renderer now instantiates visible project lights as real Three.js point lights; the studio render pipeline creates preview/final/compositing jobs with dedupe, estimates, stale-revision cleanup and manifest export.
  - Studio quality control scores camera, takes, lighting, continuity, audio and render readiness, focuses the weakest shot, applies repeatable repairs and exports a review report.
  - Non-destructive shot creative variants preserve and restore camera, lighting, post-processing and render-pass decisions with comparison, rating and best-choice application.
  - Minecraft Creation Suite adds bounded seed/version/loader projects, camera-aware chunk streaming, safe imported mod-asset binding, non-destructive building/blueprints, voxel modeling and OBJ synchronization.
  - Ready Steve/Alex and Vanilla mob rigs, editable voxel-model auto-rigging, group formations, shared presets, retiming and deterministic crowd variation simplify simultaneous multi-rig animation.
  - Collision Studio offers global/world/entity toggles, profiles, helpers, ground snap, overlap repair and sampled timeline avoidance; 20 quick VFX and 16 post finishes feed non-destructive stacks.
  - Low-end, balanced and cinematic targets bound chunks, blocks, model cubes, rigs, lights, effects and keyframes; portable packages include streaming plans, blueprints, OBJ assets, simple rigs and mod-asset reports.
- Production-bounded Java world import:
  - read-only folder scan with `level.dat`, Overworld, Nether, End, and custom dimensions
  - validated Anvil sectors, bounded NBT, corrupt chunk/region isolation
  - modern palettes/properties, padded and continuous block-state packing, negative Y
  - spawn/manual coordinates, radius/region/chunk selection, clickable top-down preview
  - conservative estimates, saved import profiles, cancellation, changed-chunk reimport, unload
  - transferable worker decoding with deterministic main-thread fallback and stale-result rejection
  - scene-only hidden chunks, temporary block props, markers, anchors, and collision helpers
  - versioned fingerprinted portable chunk cache or honest reference-only packages
  - face-culling instanced mesh preview, chunk borders, and world-origin helpers
- Professional character rig MVP:
  - Steve Classic and Alex Slim rig presets
  - bone-level selection from viewport and outliner
  - bone rotation editing and keyframes
  - pose library and rig animation presets
  - skin PNG import with 64x64 and legacy 64x32 validation
  - Minecraft skin UV mapping for core body parts
  - Blockbench `.bbmodel` static geometry import MVP
  - hand/head/back attachment point data
  - deterministic two-bone Steve/Alex arm and leg IK with numeric hand/foot
    targets, poles, influence, live preview, and bake-to-keyframes
  - deterministic terrain-aware left/right foot locks with bounded inclusive
    ranges, fixed world anchors, and one atomic timeline/history bake
  - bounded head/camera/object look-at, motion paths, six animation layer kinds,
    ten procedural generators, key cleanup/smoothing/loop/reverse/mirror, pose
    clipboard/blending, validated attachments, and Blockbench mapping/clip tools
- Minecraft materials and lighting:
  - resource pack import from ZIP or browser folder selection
  - `pack.mcmeta` metadata and block PNG scanning
  - per-face block texture resolution with generated-color and missing-face reports
  - supported vertical-strip `.png.mcmeta` animation playback
  - texture atlas layout and browser canvas atlas builder
  - solid, transparent, leaves, adjustable water, glass, emissive, and unknown presets
  - nearest-neighbor Minecraft texture filtering
  - optional grass, foliage, and water biome tint placeholders
  - Lighting Studio with eight cinematic mood presets
  - sun, moon, ambient light, shadows, fog, time-of-day, rain, snow, storm, and wind
  - Nether/End atmosphere presets and deterministic precipitation
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
- Bounded live renderer telemetry and immutable device/workload budgets, plus
  semantic culling, renderer-owned material/skin/OBJ caches, VFX resource pools,
  explicit GPU/DOM/audio/worker disposal contracts, and deferred noncritical
  panels/import/export workflows with localized loading/error fallbacks.

## Current Limits

- Resource-pack animation playback is limited to supported vertical-strip `.png.mcmeta` definitions; arbitrary shaders, custom model renderers and complex animation layouts remain unsupported.
- Per-face textures cover reviewed common block mappings; arbitrary block-model inheritance, multipart conditions and mod-specific renderers use explicit fallbacks.
- Seed-only World Studio terrain is a deterministic bounded staging proxy, not an exact Mojang/mod-loader world-generation implementation. Import the matching save for exact Vanilla or modded terrain.
- Mod catalog support never executes Fabric/Forge/NeoForge/Quilt JAR code. It binds safe manifests and user-imported resource-pack, OBJ and Blockbench assets; custom runtime renderers and mod logic require dedicated adapters.
- Blockbench rig mapping is not automatic yet; Phase 5 imports static cube
  geometry as a preview object.
- Production IK, foot locks, and look-at constraints use honest numeric
  controls; optional interactive viewport target gizmos remain deferred.
- Import is intentionally bounded by max region files, max chunks, and max
  vertical sections.
- Tested assumptions target modern Java Edition Anvil worlds using palette-based
  chunk sections. Older pre-flattening chunk sections are not fully decoded.
- Browser decompression support is required for real gzip/zlib payloads.
- Native dialogs and filesystem access require the reviewed Tauri plugins and restricted runtime capabilities; browser mode uses safe file-picker/download fallbacks.
- `.minemotion` uses a stored ZIP with CRC, path, duplicate, category and size validation; historical JSON packages remain migration inputs.
- WebM export depends on browser `MediaRecorder` and `createImageBitmap`; it
  records canonical composited frames at the selected output resolution.
- Browser mode does not support MP4, H.265, ProRes, or MP3. Desktop export
  requires a user-installed FFmpeg executable and an existing output directory.
- WebM remains video-only in browser mode.
- Native FFmpeg jobs use an allowlisted argument builder and a tracked child-process registry; real platform codec/cancellation smoke tests remain a release gate.
- The final EffectComposer shader stack is represented by safe preview/export
  overlays, not a full offline compositor.
- The startup bundle is smaller through measured dynamic boundaries, but the
  startup-critical React/Three.js/editor core still exceeds Vite’s 500 kB
  warning threshold.
- External logic plugins remain disabled/untrusted by default and are limited to the worker/capability boundary; unrestricted arbitrary JavaScript/native access is not supported.

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
npm run verify:locales
npm run verify:vfx-examples
npm run verify:architecture
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

Current projects use `schemaVersion: 10`. The main save path writes a bounded
stored-ZIP `.minemotion` package containing separate indexed entries for:

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

Viewport, PNG sequence, WebM, and FFmpeg staging share deterministic schema 10
native VFX frame preparation. Local parameter keyframes evaluate from effect
time, missing targets warn safely, and disabling VFX excludes every VFX layer.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Phase 35 Release Gate](docs/PHASE_35_RELEASE_GATE.md)
- [Current Release Evidence](distribution/v1-release-evidence.json)
- [Phases 22-25 Completion Report](docs/PHASE_22_25_COMPLETION_REPORT.md)
- [Shot Production And Handoff](docs/PHASE_22_SHOTS_RENDER_HANDOFF.md)
- [Plugin SDK](docs/PLUGIN_SDK.md)
- [Recovery](docs/RECOVERY.md)
- [QA Matrix](docs/QA_MATRIX.md)
- [Release Checklist](docs/RELEASE_CHECKLIST.md)
- [Quick Start](docs/QUICK_START.md)
- [Installation](docs/INSTALL.md)
- [Current State](docs/CURRENT_STATE.md)
- [Minecraft Creation Suite phases 815–1014](docs/MINECRAFT_CREATION_SUITE_PHASES_815_1014.md)
- [Minecraft Creation Suite Phase 1014 validation](docs/MINECRAFT_CREATION_SUITE_PHASE1014_VALIDATION.md)
- [Next Session](docs/NEXT_SESSION.md)
- [Known Limitations](docs/KNOWN_LIMITATIONS.md)
- [Technical Decisions](docs/TECHNICAL_DECISIONS.md)
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
- [Phase 21 World And Environment Production](docs/PHASE_21_WORLD_ENVIRONMENT.md)
- [Phase 3](docs/PHASE_3.md)
- [Export Pipeline](docs/EXPORT_PIPELINE.md)
- [MineMotion Format](docs/MINEMOTION_FORMAT.md)
- [Video Export](docs/VIDEO_EXPORT.md)
- [Audio Export](docs/AUDIO_EXPORT.md)
- [Performance](docs/PERFORMANCE.md)
- [Phase 20.10 Operation Cancellation](docs/PHASE_20_10_OPERATION_CANCELLATION.md)
- [Phase 20.11 Bundle Splitting](docs/PHASE_20_11_BUNDLE_SPLITTING.md)
- [Phase 20.12 App Orchestration](docs/PHASE_20_12_APP_ORCHESTRATION.md)
- [Phase 20.13 Timeline Module Split](docs/PHASE_20_13_TIMELINE_MODULE_SPLIT.md)
- [Phase 20.14 Optimization Recommendations](docs/PHASE_20_14_OPTIMIZATION_RECOMMENDATIONS.md)
- [Phase 20.15 Benchmark Scenes](docs/PHASE_20_15_BENCHMARK_SCENES.md)
- [Phase 20.16 WebGPU Fallback](docs/PHASE_20_16_WEBGPU_FALLBACK.md)
- [Phase 20.17 Measurements](docs/PHASE_20_17_MEASUREMENTS.md)
- [Asset Library](docs/ASSET_LIBRARY.md)
- [Cinematic Effects](docs/CINEMATIC_EFFECTS.md)
- [VFX Package Authoring](docs/VFX_PACKAGE_AUTHORING.md)
- [Safe VFX Examples](examples/vfx/README.md)
- [VFX Node Graph Research](docs/VFX_NODE_GRAPH_RESEARCH.md)
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
