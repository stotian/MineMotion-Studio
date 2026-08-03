# Milestones

This file is a **milestone-level index** on top of the existing phase system
(`docs/ROADMAP.md`, `docs/PHASE_PROGRESS.md`, `docs/ULTRA_MASTER_PLAN_PHASES_84_600.md`,
`docs/MINECRAFT_CREATION_SUITE_PHASES_815_1014.md`, and related phase docs).

It does not renumber, replace, or override any individual phase, its status, or
its evidence. Phase-level status (`REMOTE_ACCEPTED`, `LOCAL_COMPLETE`,
`LOCAL_CORE_COMPLETE`, `EVIDENCE_BLOCKED`, ...) remains authoritative in
`docs/PHASE_PROGRESS.md`. This file exists only to make the ~1014 phases
readable as a small number of grouped milestones, and to track cross-cutting
engineering work (like the one below) that spans several already-shipped
phases rather than adding a new numbered phase.

Status definitions are unchanged from `docs/PHASE_PROGRESS.md`.

## Milestone map

| Milestone | Phases | Theme | Status |
|---|---|---|---|
| M1 — Foundations & MVP | 1–1.5 | Editor shell, viewport, timeline, save/load, plugin skeleton | REMOTE_ACCEPTED |
| M2 — Cinematic Editor | 2–3 | Post-processing, render preview, export pipeline, packages | REMOTE_ACCEPTED |
| M3 — Real Minecraft Worlds | 4, 8 | NBT/region import, chunk meshing, materials/lighting studio | REMOTE_ACCEPTED |
| M4 — Characters & Timeline | 5–7 | Rigs, skins, advanced timeline, production rendering | REMOTE_ACCEPTED |
| M5 — Renderer & Performance Architecture | 14–21 | Deterministic VFX, renderer/performance architecture, bounded world/environment pipeline | LOCAL_COMPLETE |
| M6 — Production & Reliability | 22–35 | Production tooling, extensions, workspaces, asset pipeline, audio, compositing, simulations, legal/tutorial content, distribution, beta QA, v1 gate | LOCAL_COMPLETE / EVIDENCE_BLOCKED |
| M7 — Ultra Program Engine Foundation | 36–600 | 31 specialized deterministic program engines: performance, directing, entities, world, rendering, and more | LOCAL_CORE_COMPLETE / EVIDENCE_BLOCKED |
| M8 — Director Functions | 601–715 | 115 Minecraft Director functions integrated into Production | LOCAL_FUNCTIONAL_CORE / EVIDENCE_BLOCKED |
| M9 — Studio Pro | 716–814 | 99 professional camera/review/versioning/render-queue/QC functions | LOCAL_FUNCTIONAL_STUDIO_PRO / EVIDENCE_BLOCKED |
| M10 — Creation Suite | 815–1014 | 200 functions: bounded worlds, mod assets, voxel modeling, rigs, VFX, post, optimization, export, persistence | LOCAL_FUNCTIONAL_CREATION_SUITE / EVIDENCE_BLOCKED |

For exact per-phase status, evidence commits, and blocked-task IDs, see
`docs/PHASE_PROGRESS.md` — this table only groups ranges that doc already
reports together.

## Objectives (cross-cutting engineering work)

Objectives track work that improves something across already-shipped phases
(e.g. runtime performance, not a new feature) rather than adding a phase
number. Each objective lists what shipped, what evidence backs it, and what
remains open.

### Objective O1 — Viewport runtime performance hardening (in progress)

**Why:** the editor viewport (`src/renderer/SceneRenderer.ts`, part of M5)
was rebuilding the entire Three.js scene graph — world chunks, character
rigs, props, lights, cameras, VFX — from scratch on every single animation
frame during playback, because `renderProject()` runs on every project state
change, including the per-frame `currentFrame` tick. This caused unnecessary
CPU (chunk mesh building, rig construction), GPU (buffer/texture churn), and
RAM (GC pressure) load while simply playing back an animation whose geometry
never actually changes frame to frame.

**Shipped:**
- Selection-box lookup no longer traverses the whole scene every animation
  frame; the resolved object is cached and invalidated only on selection
  change or scene rebuild.
- The scene root is now split into six persistent subgroups: `worldGroup`,
  `charactersGroup`, `lightsGroup`, `cameraHelpersGroup`, `propsGroup`,
  `dynamicGroup`.
- `worldGroup`: world/chunk/terrain meshes are rebuilt only when a
  structural signature (world data, world edits, resource packs, hidden
  chunks, render options, material context) actually changes — not on every
  playback frame, since block geometry never depends on the animation
  frame.
- `charactersGroup`: each character keeps a structural fingerprint (rig
  preset, attachments, custom geometry, skin, available OBJ assets). When
  unchanged, only bone rotations and the root transform are updated in
  place for the new frame, instead of rebuilding the rig's geometry,
  materials, and skin texture from scratch.
- `lightsGroup`: each light keeps its `THREE.PointLight` across frames;
  color/intensity/distance/castShadow are always refreshed directly
  (cheap setters, so animated light properties keep working), and only the
  helper-marker-visibility toggle forces a full rebuild.
- `cameraHelpersGroup`: helper geometry never varies, so existing helpers
  only get their transform updated; only camera add/remove/visibility
  changes rebuild.
- `propsGroup`: imported OBJ props keep their resolved/cloned object across
  frames when the referenced asset hasn't changed, updating only the
  transform.
- `dynamicGroup` (world staging, motion path, VFX) is left rebuilt every
  call. Staging/motion-path objects are cheap and not worth the added
  bookkeeping yet; VFX was investigated and intentionally left as-is (see
  below).

**Investigated and intentionally left alone:**
- **VFX primitives**: materials and (for `glowBurst`) the `InstancedMesh`
  itself are already pooled/reused across frames by `VfxResourcePool`
  (slot-based reuse, not per-frame allocation). The remaining per-frame
  allocations are `shockwave`'s `TorusGeometry` (recreated because its
  radius grows with `progress`) and `lightningStrike`'s point geometry
  (intentionally re-randomized every frame for the flicker look). Avoiding
  the `shockwave` allocation would require non-uniform scaling that doesn't
  cleanly reproduce the existing fixed-tube-thickness look without risking
  a visual change, so it was left as-is rather than risk altering the
  effect's appearance for a minor, already-small allocation.
- **The 8 `JSON.parse(JSON.stringify(...))` deep-clone sites** found in the
  initial pass: audited via call-site search. None are reachable from
  `renderProject`/`animate`/the render loop — they're all in production
  shot/variant-duplication code (`ShotManager.ts`,
  `ShotCreativeVariants.ts`, acceptance harnesses), triggered by explicit
  user actions, not per frame. No change made.

**Evidence:**
- `npx tsc --noEmit`: same 225 pre-existing, unrelated errors before and
  after this change; zero errors introduced in `SceneRenderer.ts`.
- `npx vitest run`: identical result before and after (15 failed files / 20
  failed tests, all pre-existing and unrelated — e.g. timestamp-flaky
  fixtures — / 164 passed files / 1270 passed tests).
- No new runtime measurement was possible in this environment (no GPU/
  display available to run the Tauri app), so the perf claim rests on the
  architectural change (avoided allocations/disposals per frame), not a
  captured before/after frame-time trace. Treat as **LOCAL_COMPLETE /
  EVIDENCE_BLOCKED** until someone runs it and records real
  frame-time/heap numbers from the in-app viewport diagnostics
  (`docs/PHASE_20_14_OPTIMIZATION_RECOMMENDATIONS.md`).

**Open work (possible next slice, lower priority than what shipped):**
1. A full effect-instance registry for VFX (matching by
   `effect.evaluation.instanceId` across frames) so wrapper objects, not
   just materials, persist for effects that remain active across many
   frames. Bigger change for a smaller remaining win than what's already
   shipped; not attempted here.
2. Capture an actual before/after measurement using the existing in-app
   viewport diagnostics panel (frame time, heap, render calls, loaded
   geometries/textures) during playback of a medium/large project, and
   record it here to close the `EVIDENCE_BLOCKED` status.
