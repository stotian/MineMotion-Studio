# Performance

Phase 4 adds bounded real-world import on top of the Phase 3 performance
utilities.

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

## World Import Limits

The world importer is intentionally bounded:

- max region files
- max chunks
- max vertical sections
- radius around spawn or manual chunk coordinates

Imported chunk rendering uses face culling and instanced meshes grouped by block
material. Full greedy rectangle merging is reserved for a later native/offline
renderer.
