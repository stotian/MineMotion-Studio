# Known Limitations

Priority follows the continuation protocol: P0 data/security, P1 broken core,
P2 incorrect results, P3 resources/performance, P4 incomplete advertised
behavior, and P5 polish. `Confirmed: Audit` means a focused verification is
still required before changing code.

| ID | Limitation | Confirmed | Severity | Target phase | Status |
| --- | --- | ---: | --- | --- | --- |
| LIM-001 | `.minemotion` is currently a JSON package rather than a ZIP-based portable archive | Yes | P4 | 24 | OPEN |
| LIM-002 | Atomic save, backup-before-migration, and recovery guarantees need a dedicated audit | Audit | P0/P1 | 24 | OPEN |
| LIM-003 | Native open/save dialogs and file associations are absent | Yes | P4 | 24 | OPEN |
| LIM-004 | Release-profile Tauri build is blocked on this host by Smart App Control; debug MSI/NSIS pass | Yes | P4 | 24 | ENVIRONMENT_BLOCKED |
| LIM-005 | Browser WebM remains video-only; visual frames now use selected output resolution | Yes | P4 | 22/24 | PARTIALLY_RESOLVED |
| LIM-006 | Browser export does not provide a final mixed-audio video | Yes | P4 | 22/24 | OPEN |
| LIM-007 | FFmpeg cannot be cancelled after the native process starts | Yes | P3 | 24 | OPEN |
| LIM-008 | Real FFmpeg codec execution is untested because FFmpeg is absent locally | Yes | P4 | 24 | BLOCKED_BY_ENVIRONMENT |
| LIM-009 | Preview, PNG, WebM, and FFmpeg previously used divergent VFX inputs | Yes | P2 | 15.7 | RESOLVED |
| LIM-010 | `SceneRenderer` recreates effect geometry/materials and clears roots without complete object-tree disposal | Yes | P3 | 15.8 | RESOLVED |
| LIM-011 | Preview/export consumers previously bypassed the typed evaluator | Yes | P2 | 15.7 | RESOLVED |
| LIM-012 | Entity/bone targets now resolve safely with warnings, but several registered parameters remain visually ignored by compatibility visuals | Yes | P4 | 16 | PARTIALLY_RESOLVED |
| LIM-013 | `App.tsx` and several panels own excessive orchestration; project/export/world-import/rig boundaries are extracted, while timeline and remaining composition stay large | Yes | P3/P4 | Incremental | PARTIALLY_RESOLVED |
| LIM-014 | `Animator.sampleProject` clones the broad project object while tracks exist | Yes | P3 | 20 | OPEN |
| LIM-015 | Static scene nodes and world geometry are rebuilt on project updates; imported OBJ parsing/resources are now cached per active source | Yes | P3 | 20 | PARTIALLY_RESOLVED |
| LIM-016 | IK is not connected to the production character workflow | Yes | P4 | 19 | RESOLVED |
| LIM-017 | Blockbench rig mapping and numeric rotation clips are supported, but textured preview, position/scale channels, expressions, and advanced interpolation remain explicit unsupported features | Yes | P4 | 21/future | PARTIALLY_RESOLVED |
| LIM-018 | Supported vertical-strip resource-pack animations were detected but not played | Yes | P4 | 21 | RESOLVED |
| LIM-019 | Per-face resource-pack rendering remains incomplete | Yes | P4 | 21 | RESOLVED |
| LIM-020 | Modern bounded world import is production-ready; complete pre-flattening IDs, entities/block entities, arbitrary models, and mod render APIs remain unsupported | Yes | P4 | 21/future | PARTIALLY_RESOLVED_HONEST |
| LIM-021 | External executable plugins remain disabled; no permissioned sandbox or SDK exists | Yes | P4 | 23 | OPEN_SAFE_DEFAULT |
| LIM-022 | Concrete project, export, world-import, rig, and constraint controllers now exist, but remaining timeline/VFX/panel coordination still lives in large composition modules | Yes | P3/P4 | Incremental | PARTIALLY_RESOLVED |
| LIM-023 | The main JavaScript bundle was reduced from 1,542.64 to 1,439.60 kB through measured dynamic boundaries, but startup-critical React/Three.js/editor code still triggers Vite’s 500 kB warning | Yes | P3 | 20.11/20.12-13 | PARTIALLY_RESOLVED_MEASURED |
| LIM-024 | Platforms other than Windows are not validated | Yes | P4 | 24 | OPEN |
| LIM-025 | Primitive V1 covers five renderer-neutral kinds and a burst emitter; advanced emitters/modifiers, overlays, and camera primitives remain absent | Yes | P4 | 15/16 | OPEN |
| LIM-026 | Primitive limits were per descriptor without a combined measured runtime stack budget | Yes | P3 | 15.8 | RESOLVED |
| LIM-027 | Local parameter keyframes evaluate deterministically, but dedicated keyframe editing UI is not connected yet | Yes | P4 | 16 | PARTIALLY_RESOLVED |
| LIM-028 | Custom package source updates are not automatically rebased into already embedded project recipes; projects keep the inserted version and show a version-change warning | Yes | P4 | 17/future | OPEN_SAFE_DEFAULT |
| LIM-029 | Localization service and Top Bar were live, but remaining panels/status/errors/help still contained English production strings during Phase 18 migration | Yes | P4 | 18 | RESOLVED |
| LIM-030 | English and French are complete; additional community locales still require reviewed catalog data and registration | Yes | P5 | Future/community | OPEN |
| LIM-031 | Bone motion existed in both global timeline tracks and per-character `boneKeyframes` without deterministic reconciliation | Yes | P1 | 19.1 | RESOLVED |
| LIM-032 | Two-bone IK types were registered but the solver intentionally returned an unsolved placeholder | Yes | P1 | 19.2 | RESOLVED |
| LIM-033 | Two-bone IK math is validated, but production hand/foot controls and bake-to-timeline are not connected yet | Yes | P1 | 19.3 | RESOLVED |
| LIM-034 | IK controls are numeric session tools; viewport gizmos are not implemented | Yes | P4 | 19/future | OPEN_HONEST_UI |
| LIM-035 | Foot lock, ground placement, and foot-slide reduction were not implemented | Yes | P2/P4 | 19.4 | RESOLVED |
| LIM-036 | Pure look-at math existed without head/camera/object preview and timeline bake integration | Yes | P4 | 19.5 | RESOLVED |
| LIM-037 | Look-at uses numeric session controls; viewport target gizmos and separate eye overlays remain placeholders | Yes | P4 | 19/future | OPEN_HONEST_UI |
| LIM-038 | Pure root/hand/camera path sampling existed without viewport paths and key points | Yes | P4 | 19.6 | RESOLVED |
| LIM-039 | Motion paths are inspect-only; optional direct path editing is deferred until it can reuse global keyframe commands | Yes | P5 | 19/future | OPEN_OPTIONAL |
| LIM-040 | Pure animation-layer blending existed without NLA persistence, production sampling, or layer UI | Yes | P4 | 19.7 | RESOLVED |
| LIM-041 | Procedural generation lacked the ten editable rig recipes required by Phase 19.8 | Yes | P4 | 19.8 | RESOLVED |
| LIM-042 | Key cleanup/smoothing was connected, but selected-range loop, reverse, and mirror remained unavailable | Yes | P4 | 19.9 | RESOLVED |
| LIM-043 | Pose mirror/reset existed, but there was no session copy/paste or bounded blend workflow | Yes | P4 | 19.10 | RESOLVED |
| LIM-044 | Attachments lacked authoring diagnostics/tests and OBJ attachments rendered as generic cubes | Yes | P2/P4 | 19.11 | RESOLVED |
| LIM-045 | Character expression overlays are static character settings rather than discrete timeline-keyframe properties | Yes | P5 | Future | OPEN_HONEST_UI |
| LIM-046 | JavaScript heap telemetry depends on Chromium's non-standard `performance.memory`; other runtimes report it as unavailable | Yes | P5 | 20 | OPEN_HONEST_UI |
| LIM-047 | Version 1 performance thresholds are initial guardrails and still require named hardware benchmark calibration | Yes | P3 | 20.15/20.17 | OPEN_MEASUREMENT |
| LIM-048 | CSS viewport post overlays and Canvas2D final capture share inputs but generic bloom, grain, chromatic aberration, and fog are not pixel-identical passes | Yes | P2/P4 | 20/future renderer | OPEN |
| LIM-049 | Material and skin cache cleanup assumes the current single production SceneRenderer; concurrent renderer instances need instance-safe ownership | Yes | P3 | 20.8 | RESOLVED |
| LIM-050 | Per-chunk instancing now has exact call/instance comparison, but named hardware frame-time validation remains required | Yes | P3 | 20.15 | PARTIALLY_RESOLVED |
| LIM-051 | Dynamic VFX line/ring geometry remains frame-owned because evaluated vertices/topology change; its hardware allocation cost is not yet calibrated | Yes | P3 | 20.15 | OPEN_MEASUREMENT |
| LIM-052 | Visible-block mesh preparation remains coupled to synchronous renderer rebuilds, and atlas generation has no OffscreenCanvas compatibility gate | Yes | P3 | 20/future renderer | OPEN_ARCHITECTURE |
| LIM-053 | World-import cancellation is observed between chunks, but an active worker decode has no AbortSignal/operation-level stale-result guard yet | Yes | P3 | 20.10 | RESOLVED |
| LIM-054 | Ultra Phases 36–600 provide persistent source foundations and 31 Phase 136–600 program engines, but not every phase has its final dedicated artist-facing runtime/editor | Yes | P4 | Ultra follow-up | OPEN_HONEST_UI |
| LIM-055 | Ultra rendering/VFX/color contracts are deterministic plain data; final Three.js shader/compositor parity and reviewed GPU captures remain unvalidated | Yes | P2/P4 | 76–85 | EVIDENCE_BLOCKED |
| LIM-056 | Assisted mocap stores bounded observations and corrections but does not bundle a neural pose-estimation model or a licensed visual benchmark set | Yes | P4 | 43/future | OPEN_HONEST_CAPABILITY |
| LIM-057 | Crowd, destruction, physics and battle source models are bounded and deterministic, but their highest-scale targets require measured hardware calibration | Yes | P3 | 65–75/126–127 | OPEN_MEASUREMENT |

## Phase 15.1 Outcome

The typed VFX compatibility layer fixes no renderer/runtime limitation by
itself. It prevents new schema 9 data loss by rejecting non-representable
rotation, scale, bone target, custom seed, quality, blend, layer, or definition
changes during reverse conversion. Schema 9 remains unchanged.

## Phase 15.2 Outcome

Deterministic typed frame evaluation now exists and is proven across repeated,
stepped, reordered, cloned, JSON-reloaded, and schema 9 save/reopen paths. It
does not change the visible legacy renderer. Native primitives begin in 15.3;
real viewport/offline integration and parity remain assigned to 15.7.

## Phase 15.3 Outcome

Five deterministic renderer-neutral primitives now work with per-descriptor
caps, semantic seed channels, stable quality refinement, finite-output checks,
and adversarial plain-data validation. They are not yet mapped from legacy
effects or consumed by timeline, viewport, Canvas capture, or export paths.
Advanced emitter/modifier kinds and a measured combined stack budget remain
explicitly open.

## Phase 15.4 Outcome

Effects-lane blocks now support real move, trim, duplicate, copy/paste,
enable/disable, priority, selection, deletion, and committed Inspector edits
through schema 9 project history. Save, package, undo, and reload preserve the
authoritative instances and regenerate one canonical lane. Runtime particle
budgets protect the legacy preview, but typed primitive preview/export parity,
target resolution, complete disposal, and parameter keyframes remain assigned
to 15.6-15.8.

## Phase 15.5 Outcome

The Inspector now derives every supported parameter control from the canonical
schema and reports metadata and runtime support honestly. Edits, default repair,
undo/redo, save/reload, and packages reuse schema 9 without data loss, including
bounded unknown and special own legacy keys. Safe color tokens are enforced at
validation and renderer boundaries. This does not make ignored parameters
visually active, add parameter keyframes, or migrate native VFX fields; those
remain assigned to 15.6-15.7.

## Phase 15.6 Outcome

Project schema 10 now migrates schemas 1-9 and losslessly persists native VFX
version, seed, transform, entity/bone target, parameters/local keyframes, blend,
layer, and qualities inside the single existing effects collection. JSON,
packages, autosave, history, and rollback behavior are tested; corrupt/future
data fails closed and autosave retains a previous payload. At the 15.6
checkpoint, the legacy projection still drove rendering and keyframes were not
evaluated; Phase 15.7 resolves those runtime-input gaps.

## Phase 15.7 Outcome

Schema 10 native frame evaluation now prepares every active VFX input shared by
viewport, PNG/sequence, composited WebM, and FFmpeg staging. Local parameter
keyframes evaluate from local time, target entities/bones resolve without unsafe
access, and missing references warn. `includeVfx=false` short-circuits all VFX
before the final canvas paint. Known visual presets still use a compatibility
map, and complete GPU disposal/global stack budgets remain 15.8.

## Phase 15.8 Outcome

The canonical prepared frame now measures and caps active effects, particles,
segments, and combined stack work before Three.js/Canvas allocation. Owned scene
resources are recursively disposed once on rebuild and shutdown; explicitly
shared material/skin caches are not invalidated by a renderer refresh. Repeated
add/remove/reopen and WebM success/retry/cancel/error tests cover the resource
lifecycle. Static scene rebuilding remains a Phase 20 optimization, but it no
longer leaks detached object trees.

## Phase 15.9 Outcome

The effects command boundary remains behavior-compatible while hostile input
and project/native validation live in focused modules. All command/history/
package/schema characterization tests pass, and the complete Phase 15 gate is
green. A real browser smoke was retried but remains environment-blocked before
page attachment by `Cannot redefine property: process`; no visual pass is
claimed from that attempt.

## Phase 16.1 Outcome

Built-in preset metadata and validation now exist without duplicating runtime
definition authority. Existing compatibility visuals are visible but excluded
from the stable preset count; the non-visual color-grade marker is explicitly
experimental and cannot be added from the library. Generated thumbnails remain
`pending` until the preview/cache milestone, and native content families begin
in 16.2.

## Phase 20 completion limitations

- WebGPU is not a production renderer. Detection does not imply feature parity,
  export support, resource ownership, or selection.
- Performance recommendations are advisory and currently evaluate the Draft
  profile only in the viewport diagnostics overlay.
- Benchmark fixtures provide deterministic software classifications, not
  measured FPS across user hardware.
- The Phase 20 local recovery changes have not passed the repository's complete
  dependency-based gate because the configured registry lacks locked transitive
  packages. GitHub write access also remains blocked, so remote CI acceptance is
  not claimed.

## Phases 26–35 release limitations

- The application remains version `0.8.2`; the frozen `1.0.0` contracts are a target, not a published release.
- No Windows, macOS, or Linux platform is claimed as supported until a real signed/unsigned-as-documented artifact passes its smoke matrix.
- The configured recovery registry cannot provide `@tauri-apps/plugin-fs@2.5.1`; full dependency-backed typecheck, tests, build, audit and VFX example verification are unrun.
- Rust/Cargo, native installers, real FFmpeg platform smoke tests and manual visual QA are unavailable in this environment.
- Performance thresholds exist, but production-bundle and native GPU evidence remain unmeasured.
- GitHub `main` does not contain the Phase 20–35 local commits, so remote CI, candidate tags and publication are not evidence.
- The release evaluator is intentionally red and the updater remains disabled.
