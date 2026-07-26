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
