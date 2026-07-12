# Next Session

## Exact Current Task

Start Phase 15 milestone 15.5: generate honest effect Inspector controls from
the existing parameter schemas and commit edits through the validated schema 9
controller/history path. Milestones 15.1 through 15.4 are complete.

## Phase Ordering Evidence

- Phases 1-8: completed with documented limitations.
- Phases 9-12: `NOT_DEFINED / DEFERRED`; no authentic prompts or acceptance
  criteria exist in archives, attachments, docs, or Git.
- Phase 13: `DEFERRED / PARTIAL_SPEC`; only a summary exists.
- Phase 14: completed at `3a8487a`.
- Phase 15 is the lowest fully specified unfinished phase.

## Files To Inspect First

- `src/vfx/core/VfxParameterSchema.ts`
- `src/vfx/compat/LegacyEffectAdapter.ts`
- `src/effects/EffectRegistry.ts`
- `src/effects/EffectTimelineController.ts`
- `src/ui/inspector/InspectorPanel.tsx`
- `src/ui/effects/EffectsLibraryPanel.tsx`
- `src/history/HistoryStack.ts`

## Completed Work

- Milestones 15.1-15.3 provide typed compatibility contracts, stateless seeded
  frame evaluation, and five bounded renderer-neutral primitives.
- Added one pure command controller over schema 9 `effects.instances`; no native
  collection, second store, second effects lane, or schema change exists.
- Added real insert/edit/move/trim/duplicate/copy/paste/enable/priority/delete
  operations, lane drag handles, selection, scrubbing, and disabled-state UI.
- Every successful non-no-op command regenerates one canonical effects lane and
  produces one whole-project history checkpoint. Failed/no-op commands do not.
- Added committed numeric/vector/color editing and save/export draft flushing.
- Canonicalized foreign lanes as bounded plain data and preserved their source
  position through save/reload and `.minemotion` packages.
- Added deterministic effect defaults and strict adversarial validation for
  sparse arrays, accessors, classes, duplicate IDs, non-finite values, unsafe
  ranges, malformed clipboards, and ambient entropy.
- New growth over 4,096 effect instances is rejected while oversized schema 9
  projects remain editable and repairable.
- Added legacy renderer guards: 64 active world effects, 4,096 burst particles
  per frame, 1,024 per effect, and one instanced mesh per glow burst.
- Milestone 15.4 validation: focused 8 files/96 tests, full 62 files/256 tests,
  typecheck/build/audit/diff checks green.

## Unfinished Work

- Current effect parameter controls are not fully generated from the typed
  `VfxParameterSchema`; milestone 15.5 must remove schema/UI drift.
- Schema 9 cannot store parameter keyframes or native seed, quality, transform,
  layer, or blend fields. Do not fake these fields; design them in 15.6.
- Typed primitive evaluation is not yet the shared viewport/PNG/WebM/native
  export path; preview/export parity remains 15.7.
- Target resolution and complete renderer resource disposal remain 15.7/15.8.

## Known Error

Release Tauri build is blocked by Windows Smart App Control error 4551. Debug
MSI/NSIS succeeds. The in-app browser also failed to attach to the local webview
during the 15.4 manual smoke attempt; automated drag regressions pass.

## Next Command

```powershell
git status --short --branch; git log -4 --oneline
```

## Next Implementation Step

Inventory every legacy definition parameter against its projected
`VfxParameterSchema` and the current Inspector. Design one schema-to-control
adapter for supported number/boolean/color/enum values, including defaults,
ranges, steps, validation, and committed history behavior. Reuse the 15.4
controller and do not add an alternate parameter store.

## Tests To Run

```powershell
npm run typecheck
npm test -- --run src/vfx src/effects src/ui/inspector
npm test -- --run --reporter=dot
npm run build
npm audit --audit-level=high
```
