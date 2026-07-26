# Performance

MineMotion measures the viewport before applying Phase 20 optimizations.
Diagnostics are read-only, session-only, and enabled by the existing
`performanceSettings.showDiagnostics` project setting.

## Live viewport measurements

`SceneRenderer` emits one snapshot at most every 500 ms after rendering:

- viewport startup time, measured from renderer construction to the first
  project frame;
- rolling FPS plus best, average, p95, and worst frame time over 120 samples;
- dropped frames above 33.33 ms;
- Three.js calls, triangles, points, lines, geometries, textures, and programs;
- scene entities, visible entities, traversed scene objects, embedded imported
  chunks, total effects, and active prepared effects;
- JavaScript heap used, allocated, and limit when Chromium exposes the
  non-standard `performance.memory` counters.

The compact localized overlay shows the most actionable subset. Render preview
hides it, and canvas capture does not include DOM diagnostics.

Pure sanitizers bound every counter and reject invalid clocks or heap data.
No metric is added to the project schema, history, autosave, or render output.

## Version 1 budgets

`PerformanceBudgets` defines two device profiles (`minimum`, `recommended`) and
three workload-quality profiles (`draft`, `high`, `final`). Every measured
dimension has a recommended maximum and a hard maximum. Pure evaluation returns
`pass`, `recommendation`, or `limit` without changing renderer or project state.

p95 evaluation waits for 30 samples. Missing heap and invalid measurements are
reported as unavailable. The exact version 1 table and its calibration rules
are recorded in [Phase 20.2](./PHASE_20_2_PERFORMANCE_BUDGETS.md).

## Current export strategy

PNG sequence export renders one frame at a time and yields to the browser event
loop between frames. This keeps the UI responsive and allows cancellation
between frames.

Future work should move justified heavy work to workers or the native Tauri
pipeline. Optimizations must cite a profile and reproducible benchmark rather
than treating the budget table as evidence by itself.

## World import limits

The world importer is intentionally bounded by region files, chunks, vertical
sections, and radius around spawn or manual chunk coordinates.

Imported chunk rendering uses face culling and instanced meshes grouped by block
material. Additional culling, caching, or mesh changes require reproducible
Phase 20 benchmark evidence.

## Resource lifecycle

The production renderer disposes detached owned Three.js trees on rebuild and
shutdown. Shared Minecraft materials/textures and skin textures are cache-owned:
material-context changes invalidate the former, the next project scene prunes
inactive skins, and renderer shutdown clears both.

OBJ parser materials are released when the renderer replaces them. Temporary
helper/chunk geometries allocate only when attached or are disposed immediately.
Audio playback, WebM bitmaps/tracks/listeners, scheduled callbacks, and Blob URLs
all have explicit end/error/cancellation cleanup.

## Culling

World, character, prop, VFX, and helper roots use bounded sphere decisions
against semantic layer visibility, camera distance, and six frustum planes.
Selection overrides geometric culling in editor mode; final mode uses the
camera's full far distance. Invalid or overflow entries fail open.

Imported blocks remain instanced by material within independently cullable chunk
groups. Live metrics report visible/tested roots, culling reasons, and
visible/tested chunks so the Phase 20.6 batching tradeoff can be benchmarked.

## Instancing strategy

Chunk-local material batches are retained after deterministic call/instance
comparison. A 16-chunk, 17-material all-visible fixture costs 272 world calls,
within the Draft recommended 400-call guardrail; at 4/16 visible chunks it
submits 680 rather than 2,720 instances.

All chunk material meshes in one build share one cube geometry. Materials reuse
the deterministic renderer-context cache and rigs reuse active skin textures.
Hardware frame-time calibration remains assigned to the named Phase 20.15
benchmarks.

## VFX resource pooling

The renderer owns one bounded VFX pool. Fixed unit cube/sphere geometries,
per-primitive mesh/line material slots, and particle `InstancedMesh` matrix
buffers survive scene rebuilds and reset only after the previous tree is
detached. The default caps are 512 mesh materials, 512 line materials, and 128
particle meshes; overflow resources remain scene-owned and are disposed
normally.

Particle buffers use dynamic draw usage, reuse an existing capacity, and replace
smaller slots with explicit disposal when demand grows. Owned, non-pooled
`InstancedMesh` objects now emit their disposal event so renderer-side instance
attributes cannot survive a rebuild accidentally.

For a deterministic 120-frame fixture with 64 particle systems, 16 light
pulses, 16 dynamic mesh primitives, and 32 dynamic lines per frame:

| Constructor allocations | Before | Pooled | Reduction |
| --- | ---: | ---: | ---: |
| Geometries | 15,360 | 5,762 | 62.5% |
| Materials | 15,360 | 128 | 99.2% |
| Particle buffers | 7,680 | 64 | 99.2% |

Dynamic line and ring geometries remain frame-owned because their evaluated
vertices/topology change. Their browser/GPU cost belongs to the named Phase
20.15 benchmarks rather than an unsafe mutable geometry pool.
