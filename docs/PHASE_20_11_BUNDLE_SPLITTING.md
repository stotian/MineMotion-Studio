# Phase 20.11 - Evidence-based bundle splitting

## Outcome

The production main JavaScript chunk is 103.04 kB smaller than the validated
Phase 20.10 baseline. Ten closed panels and six non-startup-critical workflow
families now load only when a user opens or invokes them.

## Measured boundaries

The Phase 20.10 source-map audit showed that React, Three.js, the viewport,
timeline, inspector, localization catalogs, scene renderer, and core editing
models dominate startup. They remain static because the editor needs them for
its first usable frame.

The following surfaces returned `null` while closed yet were imported eagerly:

- settings, templates, plugins, command palette, and help;
- export, Rig Studio, Lighting Studio, VFX Studio, and world import.

The following modules were referenced only inside already guarded user actions:

- Blockbench and resource-pack import;
- production render execution;
- PNG sequence ZIP, WebM recording, and WAV mixdown.

Those boundaries are an explicit bounded registry. No broad vendor
`manualChunks` rule, warning-limit increase, or speculative Three.js split was
added.

## Loading and failure behavior

`createDeferredPanel` returns `null` without invoking its loader while closed.
On first open it renders a localized Suspense fallback. Import rejection is
contained by a localized error boundary with a close action, so a panel network
failure does not unmount the editor.

Workflow imports stay inside their existing `try` blocks. Import failure uses
the same localized Blockbench, resource-pack, or export diagnostic as execution
failure. Successful workflows preserve their original project/history/render
contracts.

## Before and after

| Artifact | Phase 20.10 | Phase 20.11 | Change |
| --- | ---: | ---: | ---: |
| Main JavaScript | 1,542.64 kB | 1,439.60 kB | -103.04 kB (-6.68%) |
| Main gzip | 421.39 kB | 397.66 kB | -23.73 kB (-5.63%) |
| Worker JavaScript | 7.61 kB | 7.61 kB | unchanged |
| Deferred JavaScript total | 0 kB | 110.64 kB | loaded on demand |

The build emits eighteen deferred chunks, from the 0.33 kB shared helper to the
23.40 kB Rig Studio chunk. The main chunk still exceeds 500 kB. This remains an
honest measured limitation because its largest remaining dependencies are
startup-critical React/Three.js/editor modules; Phase 20.12-20.13 may reduce
application orchestration but must not hide the warning.

## Evidence

- deferred contract test: 1 file, 2 tests;
- complete frontend gate: 139 files, 593 tests;
- typecheck, localization, VFX examples, architecture, build, and audit pass;
- `App.tsx`: 2,474 / 2,839 lines;
- production build: 1,890 modules, main JavaScript 1,439.60 kB
  (397.66 kB gzip), worker JavaScript 7.61 kB, eighteen deferred chunks.
