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
| LIM-005 | Browser WebM is video-only and records live viewport resolution | Yes | P2/P4 | 22/24 | OPEN |
| LIM-006 | Browser export does not provide a final mixed-audio video | Yes | P4 | 22/24 | OPEN |
| LIM-007 | FFmpeg cannot be cancelled after the native process starts | Yes | P3 | 24 | OPEN |
| LIM-008 | Real FFmpeg codec execution is untested because FFmpeg is absent locally | Yes | P4 | 24 | BLOCKED_BY_ENVIRONMENT |
| LIM-009 | Preview, PNG, and WebM render different subsets of effects; `includeVfx=false` cannot remove world effects already in the canvas | Yes | P2 | 15.7 | OPEN |
| LIM-010 | `SceneRenderer` recreates effect geometry/materials and clears roots without complete object-tree disposal | Yes | P3 | 15.8 | OPEN |
| LIM-011 | A pure explicit frame/FPS/seed/quality evaluator exists, but legacy preview/export consumers do not use it yet | Yes | P2 | 15.7 | OPEN |
| LIM-012 | Target IDs reach primitive inputs but are not scene/bone-resolved, and several registered effect parameters are visually ignored by the legacy runtime | Yes | P2/P4 | 15.7 | OPEN |
| LIM-013 | `App.tsx` and several panels own excessive orchestration | Yes | P3/P4 | Incremental | OPEN |
| LIM-014 | `Animator.sampleProject` clones the broad project object while tracks exist | Yes | P3 | 20 | OPEN |
| LIM-015 | Static scene data and imported OBJ resources are rebuilt/reparsed on project updates | Yes | P3 | 20 | OPEN |
| LIM-016 | IK is not connected to the production character workflow | Yes | P4 | 19 | OPEN |
| LIM-017 | Blockbench import is static geometry without automatic rig/texture mapping | Yes | P4 | 19 | OPEN |
| LIM-018 | Animated resource-pack textures are detected but not played | Yes | P4 | 21 | OPEN |
| LIM-019 | Per-face resource-pack rendering remains incomplete | Yes | P4 | 21 | OPEN |
| LIM-020 | World import is intentionally bounded and older pre-flattening/decompression cases remain limited | Yes | P4 | 21 | OPEN |
| LIM-021 | External executable plugins remain disabled; no permissioned sandbox or SDK exists | Yes | P4 | 23 | OPEN_SAFE_DEFAULT |
| LIM-022 | Service interfaces exist, but concrete domain controllers remain largely inside `App.tsx` | Yes | P3/P4 | Incremental | OPEN |
| LIM-023 | Main JavaScript bundle is about 1 MB and triggers a Vite chunk warning | Yes | P3 | 20 | OPEN |
| LIM-024 | Platforms other than Windows are not validated | Yes | P4 | 24 | OPEN |
| LIM-025 | Primitive V1 covers five renderer-neutral kinds and a burst emitter; advanced emitters/modifiers, overlays, and camera primitives remain absent | Yes | P4 | 15/16 | OPEN |
| LIM-026 | Primitive limits are per descriptor; a combined per-frame stack budget awaits real stack integration and measurement | Yes | P3 | 15.8/20 | OPEN |
| LIM-027 | Schema 9 cannot persist VFX parameter keyframes or native seed/quality/layer/blend/transform fields | Yes | P4 | 15.6 | OPEN |

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
