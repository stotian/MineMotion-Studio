# Phase 25 — Evidence-based frontier selection

## Selected candidate

Only **procedural Minecraft crowds** is promoted, behind the `procedural-crowds` feature flag. Enable it with `?feature=procedural-crowds` or the local experimental flag key. The prototype appears in the production workspace and does nothing to the stable project until the user presses Apply.

The generator is deterministic from count, radius, center, spacing and seed. It caps output at 80 characters, uses bounded placement attempts, reports generated count, density, generation time and estimated CPU/GPU bytes, and clones only host-owned character data. Applying creates ordinary scene characters, so saving, undo/history, rendering and later editing remain on established code paths.

## Evidence and prerequisites

The renderer already has character resource caching, culling, budgets and crowd-sized benchmark scenes. The prototype adds no networking, secrets, executable package boundary or native dependency. Expected value is rapid population of battles, cities and background scenes. Main cost is draw/rig complexity; the hard cap and displayed estimates keep the experiment measurable.

## Deferred candidates

- AI: no local/private deterministic architecture or funding model is established.
- Physics: needs a versioned simulation/cache contract and reproducible baking.
- Mocap: needs importer evidence and retargeting quality benchmarks.
- Collaboration: introduces identity, networking, conflicts and data-security risk.
- Advanced rendering: WebGPU is detected but no production backend exists.
- Community systems: require signing, moderation, provenance and update infrastructure.

Promotion to stable requires user tests showing faster scene setup, renderer benchmarks within Phase 20 budgets, undo/save/export regression coverage and a reviewed crowd authoring UX. Until then the roadmap keeps it experimental.
