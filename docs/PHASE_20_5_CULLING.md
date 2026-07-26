# Phase 20.5 - Measurable culling

## Outcome

The production viewport now evaluates bounded renderer-neutral sphere culling
before each WebGL render and reports the actual decisions beside renderer calls
and triangles.

## Decision contract

Each registered scene root has:

- a unique runtime ID and optional project-selection ID;
- one semantic Three.js layer owner;
- a finite world-space bounding sphere;
- optional chunk coordinates.

The pure evaluator uses this stable order:

1. invalid input: fail open as visible;
2. disabled semantic layer: culled;
3. selected editor object: visible override;
4. sphere beyond camera distance: culled;
5. sphere outside any camera-frustum plane: culled;
6. otherwise visible.

Distance uses the active camera far plane, so final rendering does not invent a
shorter content range. Selected project objects override distance/frustum only
in editor mode. Project `visible` fields are never modified.

Evaluation is capped at 4,096 roots per frame. Overflow remains visible and is
reported as unmeasured rather than disappearing.

## Chunk culling

Imported visible blocks remain instanced by material, now within one group per
chunk. Chunk roots can therefore be hidden independently. Non-empty chunks use
their rendered geometry bounds; empty chunks use conservative logical
coordinates and vertical bounds.

This can trade fewer off-screen calls for more calls when every chunk is
visible. Phase 20.6 must benchmark that tradeoff before changing batch size,
cache behavior, or instance layout.

## Registered roots

- preset terrain and imported chunks;
- characters;
- imported OBJ props;
- editor camera helpers and motion paths;
- imported-world helpers;
- world VFX.

Grid and selection helpers retain their dedicated visibility rules and are too
small/interactive to benefit from this root culling.

## Measurements

`RendererMetricsSnapshot.culling` reports:

- tested, visible, invalid, and unmeasured roots;
- layer, distance, and frustum culled roots;
- selection overrides;
- chunks tested and chunks visible.

The localized diagnostics overlay displays visible/tested roots, each culled
class, and visible/tested chunks.

## Evidence

- focused culling/metrics gate: 4 files, 10 tests;
- complete frontend gate: 128 files, 551 tests;
- typecheck, localization, architecture, build, and audit pass;
- `App.tsx`: 2,642 / 2,839 lines;
- production build: 1,880 modules, 1,531.08 kB JavaScript
  (417.74 kB gzip), retaining the known large-chunk warning.
