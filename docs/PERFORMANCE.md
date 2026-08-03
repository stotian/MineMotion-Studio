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

## Runtime asset ownership

Each production `SceneRenderer` now owns its Minecraft material/texture cache,
skin texture cache, and parsed OBJ template cache. Clearing or changing one
renderer cannot release another renderer's GPU resources.

Materials and skin textures remain lazy and prune on context or visible
consumer changes. OBJ source stays authoritative in the project; the runtime
parses an asset only when a visible scene object or visible character attachment
references it. Rebuilds clone independent object nodes while sharing
cache-owned immutable geometry and one renderer-owned material. Removing,
hiding, or changing the last consumer disposes the old template resources.

Persistent resource-pack, skin, OBJ, audio, world, and package payloads remain
plain project data. Playback/capture operations own their temporary media
objects, and scene/VFX owners manage GPU resources. The unused chunk mesh cache
also disposes replaced, deleted, and cleared trees completely before any future
runtime activation.

## Worker boundary

World import keeps the fixed 8 KiB MCA location/timestamp table on the main
thread, then transfers a copy of each selected compressed chunk payload to one
module worker reused for the import. Decompression, NBT parsing, palette/section
decoding, and plain `ImportedChunkData` construction run there.

The worker and fallback call the same `decodeWorldChunk` function. If workers
are unavailable, construction throws, or bootstrap fails, the untouched MCA
source view is decoded on the main thread. Invalid chunk data preserves its
error rather than being silently retried. Vite emits the worker separately
(7.55 kB in the Phase 20.9 build).

The Phase 20.9 audit leaves these bounded paths unchanged:

- MCA header selection is fixed-size and required before payload transfer;
- Three.js mesh creation stays on the renderer thread until scene rebuild is
  asynchronous;
- the unused atlas builder requires DOM `Image`/canvas and lacks a proven
  OffscreenCanvas compatibility gate;
- package archives remain explicit and size/count bounded without evidence for
  a worker threshold;
- generated SVG thumbnails remain capped, cached, cancellable, and scheduled
  one at a time during idle work.

## Abort and stale-result boundary

World scans and imports now carry one monotonic public operation ID with an
`AbortSignal`. Cancellation is checked around asynchronous file, decode,
progress, and browser-yield boundaries. An active worker decode is terminated,
and replies must match both the client request ID and public operation ID before
they can settle.

The React integration accepts progress and final results only while that ID is
current. Starting another scan/import, replacing the project, unloading the
world, or unmounting invalidates earlier work before it can mutate project or
history state. The operation state remains session-only and adds no persistent
data or per-chunk commits.

The Phase 20.10 build emits 1,886 modules, a 1,542.64 kB main JavaScript chunk
(421.39 kB gzip), and a 7.61 kB worker. This is the bundle-splitting baseline.

## Deferred bundle boundaries

Phase 20.11 defers ten panels that previously returned `null` while closed:
settings, templates, plugins, command palette, help, export, Rig Studio,
Lighting Studio, VFX Studio, and world import. A localized Suspense/error
boundary invokes no loader while its panel is closed.

Blockbench/resource-pack import, production render execution, PNG sequence ZIP,
WebM recording, and WAV mixdown also load only inside their existing guarded
user actions. Their import failures follow the same localized error path as
workflow failures.

| Artifact | Before | After | Change |
| --- | ---: | ---: | ---: |
| Main JavaScript | 1,542.64 kB | 1,439.60 kB | -103.04 kB (-6.68%) |
| Main gzip | 421.39 kB | 397.66 kB | -23.73 kB (-5.63%) |
| Worker JavaScript | 7.61 kB | 7.61 kB | unchanged |
| Deferred JavaScript total | 0 kB | 110.64 kB | on demand |

The build warning remains because the largest source-map contributors include
startup-critical Three.js, React DOM, viewport/timeline/inspector, localization,
and renderer code. Phase 20.11 neither raises the warning threshold nor invents
a vendor split that would load the same bytes before the editor becomes usable.

## Advisory diagnostics

The viewport evaluates its bounded metrics snapshot against the Draft quality
budget and displays at most three hard-limit-first recommendations. The report
is read-only and does not alter project data, visibility, effects, world radius,
or quality. Missing measurements are not inferred.

## Reproducible scene fixtures

Five deterministic fixtures represent small, medium, large-world, VFX-fight,
and storm workloads. They use fixed IDs/timestamps, expected complexity and
Draft classifications, stable VFX benchmark expectations, and JSON round-trip
coverage. They are software regression inputs, not hardware FPS claims.

## Renderer backend policy

WebGL2 is the primary production backend and existing WebGL is the fallback.
WebGPU detection remains experimental evidence only. A runtime with WebGPU but
without a production WebGL backend reports unavailable rather than silently
using an incomplete path.

## Regression gates

The measured Phase 20 baseline and ceilings are recorded in
`PerformanceRegressionBaselines` and one shared JSON threshold file. CI checks
main JavaScript <= 1,520,000 bytes, all JavaScript <= 1,700,000 bytes, and worker
JavaScript <= 30,000 bytes after the production build. Architecture checks keep
`App.tsx` <= 1,900 lines and `TimelinePanel.tsx` <= 1,000 lines.
