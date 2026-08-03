# Phase 20.12 - Project workspace orchestration extraction

## Scope

This milestone characterizes and extracts one cohesive responsibility from
`App.tsx`: the project document lifecycle. It does not move rendering,
selection, timeline editing, VFX editing, rigging, or panel coordination.

## Characterized behavior

The extracted boundary preserves these existing contracts:

- one authoritative `MineMotionProject` state and mutable ref;
- one `HistoryStack` for whole-project undo/redo;
- dirty-state confirmation before destructive replacement;
- new project and template replacement with history reset;
- `.minemotion` package save/load and schema 9 `.mmsproj` export;
- recent-project metadata updates;
- browser autosave recovery and periodic autosave;
- localized status and diagnostic messages;
- world-import invalidation supplied by the composition root before replacement.

## Implementation

`src/project/workspace/useProjectWorkspaceController.ts` now owns project state,
history, dirty state, autosave, open/save, replacement, and undo/redo commands.
`src/project/workspace/ProjectWorkspacePersistence.ts` keeps package/legacy
serialization and recent-project artifact construction pure and testable.

`App.tsx` remains the composition root. It supplies settings, localization,
status reporting, and the world-import reset callback, then consumes the single
workspace controller. Selection is reset from a monotonic replacement version;
there is no second project store, event bus, or persistence authority.

## Size result

| Artifact | Before | After | Change |
| --- | ---: | ---: | ---: |
| `src/App.tsx` | 2,014 lines | 1,855 lines | -159 (-7.9%) |
| Architecture ceiling | 2,839 lines | 1,900 lines | -939 |

The new ceiling leaves a small explicit composition-root budget and cannot be
satisfied through minification or compressed formatting.

## Verification

Passed in the recovery environment:

- double inventory/read of all 713 recovered repository files;
- double inventory/read of all 122 context files;
- focused TypeScript syntax transpilation for changed files;
- executable package/legacy/recent-project smoke round-trip;
- `node scripts/verify-app-size.mjs` (`1,855/1,900`);
- `git diff --check`;
- manual diff review twice, including selection callback and replacement-order
  verification.

The normal locked install and therefore the full TypeScript/Vitest/Vite/audit
gate could not run locally because the configured package registry returned
404 for locked transitive packages (`yallist@3.1.1` and
`why-is-node-running@2.3.0`) while external DNS was unavailable. This is an
environment limitation, not a weakened gate; remote CI must remain the final
full-gate evidence. GitHub write attempts through both Git data and Contents API
returned `403 Resource not accessible by integration`, so this recovery archive
is the authoritative local handoff until connector write access is restored.

## Next boundary

Characterize `TimelinePanel` before splitting view-only regions. Keep the
existing timeline data and command authorities unchanged, and avoid moving
project/history ownership back into UI components.
