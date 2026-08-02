# Phase 20.12 - Project workspace orchestration extraction

## Outcome

`App.tsx` now delegates the complete project-document lifecycle to
`src/project/workspace`. The composition root still coordinates world-import
invalidation and editor selection; it does not own a second project store.

## Preserved contracts

- One authoritative `MineMotionProject` state/ref and one whole-project
  `HistoryStack` remain in use.
- New/template/load replacement keeps dirty confirmation, history reset,
  localized status, selection reset, and world-import cancellation order.
- Browser `.minemotion` JSON packages, schema 9 `.mmsproj` export, schema 9
  migration to schema 10, recent-project records, and autosave recovery retain
  their existing serializers and persistence paths.
- The snapshot's later ZIP-only `PackageReader.parseBytes` contract was not
  imported: the real repository's JSON package reader remains authoritative.

## Structure and measurement

`ProjectWorkspacePersistence` contains pure package/legacy artifacts, parsing,
and recent-project metadata. `useProjectWorkspaceController` owns project
state, dirty/history operations, replacement, browser file operations, and
autosave. `App.tsx` passes only the existing dependencies and reset callback.

| Measure | Before | After | Change |
| --- | ---: | ---: | ---: |
| `src/App.tsx` | 2,014 lines | 1,856 lines | -158 (-7.8%) |
| Main JavaScript | n/a for this structural extraction | 1,441.12 kB | no runtime-performance claim |

## Evidence

- Characterization first: the new workspace persistence test initially failed
  before the extraction and then passed against the real JSON package format.
- Targeted persistence/autosave/serializer gate: 3 files, 24 tests.
- Complete gate: typecheck; 141 files/601 tests; locale and VFX-example gates;
  architecture gate (`1,856/2,839`); production build; and audit (0 high
  vulnerabilities).
