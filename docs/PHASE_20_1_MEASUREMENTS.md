# Phase 20.1 - Renderer measurements

## Outcome

The production viewport now exposes bounded live measurements from the actual
Three.js render loop. This establishes the inputs for budgets and benchmarks
without changing project data or renderer behavior.

## Measurement contract

- `PerformanceMonitor` retains 120 positive frame intervals and reports FPS,
  best, average, p95, worst, dropped-frame count, and sample count.
- `RendererMetrics` sanitizes `renderer.info`, optional browser heap values, and
  project-complexity counters into clone-safe plain data.
- `SceneRenderer` captures startup at the first project frame and emits metrics
  no more than twice per second after a completed render.
- `Viewport` displays a localized overlay only when the existing diagnostics
  setting is enabled and production render preview is inactive.

Memory is honestly unavailable when `performance.memory` is absent. Startup is
the viewport renderer startup interval, not a cold operating-system or Tauri
launch benchmark.

## Evidence

- focused performance tests: 2 files, 4 tests;
- complete frontend suite: 119 files, 530 tests;
- typecheck, localization, architecture, production build, and audit pass;
- `App.tsx`: 2,674 / 2,839 lines;
- production build: 1,874 modules, 1,521.63 kB JavaScript
  (414.77 kB gzip), with the known large-chunk warning retained as evidence.

## Next

Phase 20.2 defines Minimum, Recommended, Draft, High, and Final budgets from
these measurement fields. No optimization threshold is inferred solely from
the current bundle warning.
