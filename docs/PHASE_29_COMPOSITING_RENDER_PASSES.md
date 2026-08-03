# Phase 29 — Compositing and render passes

Status: **LOCAL_COMPLETE**

## Delivered

- One canonical post-processing plan shared by CSS preview and offline canvas
  capture.
- Real color grade, bloom, vignette, deterministic grain, chromatic offset,
  pixelation and fog operations with draft/final quality scaling.
- Eight production outputs: beauty, alpha, world, characters, VFX, depth,
  normals and object ID.
- Depth and normals use dedicated Three.js override materials. Object ID uses
  stable colors and a metadata sidecar mapping IDs to scene names.
- Per-shot post-processing overrides travel with render jobs.
- Pass metadata records frame, camera, dimensions, color-space semantics and
  transparency.
- Bounded render-target pool with explicit lease/release/dispose behavior.
- Deterministic pass folders and names continue to use the production handoff
  contract.
- Four compositing benchmark cases cover preview, multilayer, data passes and
  4K final output.

## Validation

- Strict targeted TypeScript checks across post planning, canvas processing,
  pass metadata, shot migration and render job creation.
- Runtime checks for canonical operation order, render-target reuse/disposal
  and benchmark thresholds.
- Acceptance tests cover all eight passes, data-pass metadata and per-shot post
  overrides.
- Static syntax/import/localization, diff and architecture gates pass.

GPU visual parity and native 4K performance remain part of the blocked full
browser/native release gate; no unsupported color-management guarantee is made.
