# Current state

MineMotion Studio remains version `0.8.2`. It targets project schema `10`, settings schema `2`, `.minemotion` stored-ZIP package schema `1`, template schema `1`, and extension API `1.0`. The target v1 public contracts are frozen, but the product is **not released as v1.0**.

## Source state

- GitHub `main` readback during this recovery session: `9e42943408379fee247a314542c8134be8f25a82`.
- Local completion branch: `agent/complete-v1-phases-26-35`.
- Local implementation covers Phases 20–35 through the Phase 35 fail-closed release audit.
- Completion-pack progress: **285/298 tasks (95.64%)** locally evidenced; **13** tasks require external release evidence.

A recovered GitHub snapshot containing 710 source files was compared byte-for-byte with the current tree: all 710 still exist, 579 remain identical, 131 were intentionally modified, 225 were added, and none were removed. Static analysis then inspected the complete current source graph.

## What is implemented after Phase 25

- Seven persistent professional workspaces with responsive/resizable panels, searchable help, schema-driven inspector, improved outliner/timeline, light/high-contrast/reduced-motion presentation, and truthful capability indicators.
- Versioned asset catalog with embedded/reference/cache policies, integrity, asynchronous thumbnails, duplicate detection, relink, dependency inspection, reversible cleanup, package portability, and bounded worker-oriented import paths.
- Frame-accurate audio offsets/fades/gain/pan/mute, waveform cache, markers/phonemes, cancellable deterministic WAV mixdown, stems, timing metadata, and FFmpeg handoff.
- Shared preview/offline post plan and eight real passes: beauty, alpha, world, characters, VFX, depth, normals, and object ID.
- Seven deterministic procedural simulation families with Draft/Final budgets, cancellation, editable bakes, cache invalidation, and reload support.
- Nine legal production templates, generated samples, preset packs, tutorials, benchmarks, previews, dependencies, custom-template round trips, and legal CI validation.
- First-launch/onboarding/help/accessibility and complete user/developer/recovery/troubleshooting documentation with link validation.
- Four-target distribution definitions, native CI matrices, associations, manifests, checksums, updater-off policy, signing/notarization guidance, and honest zero-support-claim status until artifacts pass.
- Public-beta truth, migration, corruption, stress, compatibility, golden-project, diagnostics, issue, performance-threshold, and release-decision matrices.
- Frozen v1 contracts, security/legal source gate, third-party notices, guarded release workflow, draft notes, post-release backlog, and machine-readable fail-closed release evidence.

## Ultra milestone after the v1 completion branch

- The Ultra registry and master instruction plan now cover **Phases 36–600: 565 total phases**.
- Phases **36–83** retain their five typed legacy domain engines and persistence model.
- Phases **84–135** add dedicated deterministic source engines for offline final rendering, Minecraft-native modeling, professional animation editing, integrated editorial finishing and production workflow simplification.
- Phases **136–600** add 465 explicit versioned capability contracts executed through 31 specialized program engines. Every contract includes dependencies, three deliverables, resource budgets, reversible operators, fallbacks, evidence type, a stable source owner and a unique acceptance test ID.
- `npm run verify:ultra` passes **565 phase tests, 52 dedicated Phase 84–135 foundation tests, 1,263 top-level assertions and 7,986 internal phase-contract assertions**.
- The Ultra subdocument round trip preserves all **565/565 phase records**; historical projects without Ultra data still migrate to an empty schema-1 subdocument.
- The complete generated instruction source is `docs/ULTRA_MASTER_PLAN_PHASES_84_600.md`; its canonical machine-readable registry is `src/ultra/roadmap/UltraRoadmap84To600.json`.
- This is a source/program-engine foundation, not a claim that all 465 later capabilities are production-complete artist-facing tools. Artistic quality, real-video mocap quality, final GPU parity, native interoperability and large-scale hardware performance remain evidence-blocked.

## Minecraft Director and Studio Pro foundation — real Phases 601–814

- The first **214 functional registry entries**, numbered 601–814, form the Director and Studio Pro foundation. Unlike the Phase 136–600 contracts, each entry maps to an implemented operation, an existing source owner and a unique acceptance ID executed by the Director gate.
- Phases **601–715** retain the film-starting layer: shot recipes, complete sequence generation, synchronized camera cuts, shot editing, looks, actor/Minecraft choreography, dialogue performance, cinematic beats/events, environment and sound direction, blocking, preflight/repair and production-document exports.
- Phases **716–814** add the Studio Pro layer: ten physical-lens profiles, six professional camera moves, subject focus/framing/tracking, horizon stabilization, persistent take ratings/favorites/rejections/notes/tags/revisions, take comparison, shot batch tools, eight real scene-light rigs, animation-polish actions, continuity analysis/repairs, a production render pipeline, six-department film quality scoring/repair and non-destructive creative variants that snapshot camera, lighting, post-processing and render passes per shot.
- The Production workspace exposes these operations directly. Take review data survives project sanitization/reload, reviewed takes can be compared and selected, and the render queue now shows production take/revision/pass metadata.
- Scene `light` entities now create real Three.js point lights in the shared viewport/export renderer instead of existing only as project records. Studio rigs therefore illuminate the scene and can cast shadows; generated lights remain removable and bounded to 16 visible scene lights.
- The studio render pipeline builds distinct preview, final and compositing plans, selects selected/approved/active takes, prevents duplicate jobs, estimates workload, orders and prioritizes jobs, retries/cancels work, removes stale revisions, synchronizes queue settings after shot edits and exports a JSON queue manifest.
- The Phase 814 baseline passed **214/214 functional phases and acceptance IDs with 603 assertions**; the current combined Phase 1014 gate is reported below.
- Canonical mappings: `docs/DIRECTOR_REAL_PHASES_601_715.md` and `docs/DIRECTOR_STUDIO_PRO_PHASES_716_814.md`.
- This is meaningful functional source completion, but it is not yet evidence that MineMotion matches Blender as a general-purpose DCC. Dependency-backed UI tests, actual WebGL image review, complete film rendering, native builds, codec validation and measured GPU performance remain blocked or uncollected.

## Minecraft Creation Suite milestone — real Phases 815–1014

- The Director registry now contains **414 contiguous functional phases, 601–1014**. The Creation Suite adds exactly **200 implemented operations**, each with an existing source owner and an acceptance ID executed by the same fail-closed gate.
- World Studio stores seed, Java version, loader target and bounded chunk area. It can create an optimized blank stage or deterministic proxy terrain, and it streams only bounded imported chunks around the active camera using near/medium/far LOD simplification.
- Exact Mojang or modded world generation is not fabricated: exact terrain requires importing the matching world save. The proxy is for fast staging and layout.
- Mod support parses safe manifests and connects user-imported resource packs, OBJ and Blockbench assets. It never executes Fabric, Forge, NeoForge or Quilt JAR code.
- Building is non-destructive and includes fill/replace/clone, twelve structures, line/sphere/cylinder brushes, layer mirror/duplicate and reusable blueprints. Modeling includes primitives, templates, transforms, cleanup, world extraction, OBJ export and scene synchronization.
- Rigging includes Steve, Alex and distinct Vanilla mob skeletons, bounded crowds, formations, shared animation/pose operations and editable voxel-model auto-rigging whose custom geometry is rendered and reload-safe.
- Collision can be disabled globally or independently for world/entity interactions. Profiles, helpers, ground snap, overlap resolution and timeline sampling/baking are available.
- Twenty quick VFX, sixteen post finishes, a non-destructive ordered post stack, three performance targets and a portable package exporter complete the workflow.
- A six-tab Production interface exposes the suite. Canonical mapping: `docs/MINECRAFT_CREATION_SUITE_PHASES_815_1014.md`.
- `npm run verify:director` passes **414/414 functional phases, 14 shot recipes, 18 generated sequence shots, 8 animated camera tracks and 787 assertions**.
- This remains source-level functional evidence. Full dependency-backed builds/tests, reviewed WebGL frames, native installers, codecs and measured hardware/film evidence remain fail-closed.

## Validation passed in this environment

- 783 TypeScript/TSX files: syntax audit passed.
- Every relative TypeScript import resolves.
- 1,917 EN and 1,917 FR keys with exact parity.
- No empty catches or explicit `any` remain in the audited source.
- Architecture ceilings: `App.tsx` 1,891/1,900; `TimelinePanel.tsx` 987/1,000.
- Template, documentation-link, onboarding-documentation, cross-platform, release-input, beta-contract and security/legal scripts pass.
- Targeted strict TypeScript/runtime checks for release contracts and the release evaluator pass.
- JSON integrity and `git diff --check` pass.

## External blockers

- Locked dependency installation cannot complete in this container: the internal npm gateway does not provide the locked Tauri package and direct public-registry installation stalls. The package itself exists publicly; the blocker is this environment, not the project manifest.
- Without dependencies, the complete project typecheck, Vitest suite, Vite build, npm audit, VFX example verification and post-build budget cannot run.
- Rust/Cargo and real OS installer runners are unavailable.
- Manual visual QA has not been completed.
- GitHub does not contain the local completion commits; remote CI and publication cannot run.
- No signing, tagging or publication authorization is available.

See `docs/PHASE_35_RELEASE_GATE.md` and `distribution/v1-release-evidence.json`.
