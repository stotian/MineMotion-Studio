# Phase 20.6 - Instancing and cache evidence

## Outcome

MineMotion retains chunk-local material instancing because its default-world
call cost stays inside the Draft world-call allowance while it rejects
substantial off-screen instance work. One cube geometry is now shared by every
material mesh in every chunk for a build.

## Reproducible comparison

The pure bounded estimator compares:

- global material batches: one call per material, but partially visible worlds
  still submit every instance;
- chunk material batches: one call per visible chunk/material pair and only
  visible chunk instances.

Fixture: 16 chunks, 17 block materials, 10 instances per material/chunk.

| Visibility | Strategy | Calls | Drawn instances | Rejected instances |
| --- | --- | ---: | ---: | ---: |
| 16/16 chunks | Global | 17 | 2,720 | 0 |
| 16/16 chunks | Chunk-local | 272 | 2,720 | 0 |
| 4/16 chunks | Global | 17 | 2,720 | 0 |
| 4/16 chunks | Chunk-local | 68 | 680 | 2,040 |

The chunk-local all-visible world calls remain below the version 1 Draft
recommended maximum of 400, leaving 128 calls for the rest of that scene.
Mostly off-screen work submits 75% fewer instances.

This is exact batch/work accounting, not a hardware frame-time claim. Phase
20.15 must record browser/GPU frame measurements.

## Implemented reuse

- one lazily allocated `BoxGeometry` is shared across every imported chunk mesh
  and disposed exactly once;
- this fixture saves 15 redundant geometries;
- one material is reused for an unchanged Minecraft material context;
- one skin texture load is reused for repeated rigs with the same data URL;
- context changes and removed skins retain the Phase 20.4 invalidation rules.

No persistent mesh-tree cache or parsed-OBJ cache was introduced because
instance-safe asset ownership and stale-result handling belong to later Phase
20 tasks.

## Evidence

- focused instancing/cache gate: 4 files, 9 tests;
- complete frontend gate: 129 files, 555 tests;
- typecheck, localization, architecture, build, and audit pass;
- `App.tsx`: 2,642 / 2,839 lines;
- production build: 1,880 modules, 1,531.09 kB JavaScript
  (417.75 kB gzip), retaining the known large-chunk warning.
