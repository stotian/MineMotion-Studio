# Phase 20.4 - Resource disposal audit

## Outcome

The current single production `SceneRenderer` now owns every mutable Minecraft
material and skin-texture cache lifecycle. Rebuilds release detached owned
trees, context changes invalidate stale cached GPU resources, removed skins are
pruned, and renderer shutdown clears both caches.

## Fixed findings

| Resource | Finding | Resolution |
| --- | --- | --- |
| Minecraft materials/textures | Cache survived every context change and renderer shutdown; default preset was absent from cache identity | Deterministic full context signature, invalidation after old-root disposal, direct cache disposal, corrected identity |
| Skin textures | Every skin data URL remained in a module cache | Retain only valid skins used by the next scene; clear on renderer shutdown |
| Parsed OBJ materials | Parser-owned materials were overwritten without disposal | Dispose unique parser materials and share one new owned replacement per OBJ |
| Camera helper geometry | Temporary cone source for `EdgesGeometry` was unattached | Dispose the source immediately after edge construction |
| Empty chunk geometry | Cube geometry was allocated even when no block mesh referenced it | Allocate lazily on the first renderable block |
| Imported audio | Completed elements remained mapped; stop did not release their source | Remove completed entries and release source/decoder state on end or stop |
| Placeholder audio | App-owned `AudioContext` had no shutdown path | Disconnect ended nodes and close the context through an extracted React lifecycle hook |
| Blob downloads | Exceptional link activation could skip URL revocation | One shared `try/finally` download boundary |

`App.tsx` dropped from 2,674 to 2,642 lines because audio playback lifecycle
moved to `useProjectAudioPlayback`.

## Existing paths revalidated

- `disposeThreeObjectTree` deduplicates and disposes owned geometries, materials,
  textures, render targets, skeletons, and nested uniform/user-data resources;
- explicitly shared materials/textures survive scene rebuild and are released
  only by their cache owner;
- `SceneRenderer.dispose` cancels RAF, removes pointer/resize listeners,
  disposes OrbitControls, render lists, WebGL renderer/context, DOM canvas, and
  telemetry;
- WebM capture closes every `ImageBitmap`, removes recorder listeners, and stops
  all media tracks on success, error, cancellation, and start failure;
- preset-preview idle callbacks and App intervals/RAF effects return cancellation
  cleanup;
- there are no production WebGL render-target allocations outside the audited
  generic disposal support.

The legacy `ResourceTracker` and generic `disposeAll` utilities are not runtime
owners. Production ownership remains with the renderer tree and explicit cache
boundaries.

## Evidence

- focused lifecycle gate: 7 files, 17 tests;
- complete frontend gate: 126 files, 547 tests;
- typecheck, localization, architecture, build, and audit pass;
- production build: 1,878 modules, 1,525.58 kB JavaScript
  (415.96 kB gzip), retaining the known large-chunk warning.

## Boundary

The cache lifecycle assumes MineMotion's current single production
`SceneRenderer`. Phase 20.8 must make ownership instance-safe before concurrent
renderers or detached preview renderers are introduced.
