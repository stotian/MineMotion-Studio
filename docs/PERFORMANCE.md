# Performance

Phase 3 adds support utilities for keeping export and render work measurable.

## Utilities

- `PerformanceMonitor`: rolling FPS/frame-time samples.
- `ResourceTracker`: counts tracked geometries, materials, and textures.
- `disposeAll`: calls `dispose()` on renderer resources that expose it.

## Current Export Strategy

PNG sequence export renders one frame at a time and yields to the browser event
loop between frames. This keeps the UI responsive and allows cancellation
between frames.

Future work should move heavy exports to an offline render target or native
Tauri pipeline.
