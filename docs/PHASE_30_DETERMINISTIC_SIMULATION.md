# Phase 30 — Deterministic simulation and editable bakes

Status: **LOCAL_COMPLETE**

## Delivered

- Versioned simulation project data with deterministic seeds, frame ranges,
  target IDs, draft/final quality and explicit status.
- Shared deterministic clock/noise functions.
- Bounded solvers for debris/falling blocks, particle collision, cape/cloth,
  shockwave response, crowd paths, camera noise and wind.
- Asynchronous cancellable bake pipeline with progress callbacks, sample/frame/
  subject/byte budgets and stable fingerprints.
- Editable baked samples, reset/recompute, stale-cache invalidation and bounded
  cache eviction.
- Interrupted `baking` states recover as `dirty` instead of pretending success.
- Production workspace controls for creating, baking and resetting simulations.
- Simulation outputs remain MineMotion-owned overlays and never write to an
  imported Minecraft world.

## Quality modes

Draft uses lower subject, frame, sample and memory limits for responsive editing.
Final raises those limits but remains hard-bounded. Both modes use the same
solver equations and seed contract.

## Validation

- Strict targeted TypeScript check for schema, solvers, bake controller,
  migration and project integration.
- Runtime deterministic sampling of all seven solver kinds.
- Runtime bake fingerprint, cache storage and invalidation checks.
- Acceptance tests cover editing and interrupted-bake recovery.
- Static syntax/import/localization and architecture gates pass.

The solvers are intentionally cinematic approximations, not a general-purpose
rigid-body or cloth engine.
