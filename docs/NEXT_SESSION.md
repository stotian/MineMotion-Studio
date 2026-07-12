# Next Session

## Exact Current Task

Start Phase 15 milestone 15.4: integrate editing through the existing schema 9
effects timeline lane. Milestones 15.1 through 15.3 are implemented/validated.

## Phase Ordering Evidence

- Phases 1-8: completed with documented limitations.
- Phases 9-12: `NOT_DEFINED / DEFERRED`; no authentic prompts or acceptance
  criteria exist in archives, attachments, docs, or Git.
- Phase 13: `DEFERRED / PARTIAL_SPEC`; only a summary exists.
- Phase 14: completed at `3a8487a`.
- Phase 15 is the lowest fully specified unfinished phase.

## Files To Inspect First

- `src/effects/EffectTimelineTrack.ts`
- `src/project/CinematicTimeline.ts`
- `src/ui/timeline/TimelinePanel.tsx`
- `src/ui/effects/EffectsLibraryPanel.tsx`
- `src/project/ProjectStore.ts`
- `src/history/HistoryStack.ts`
- `src/vfx/compat/LegacyEffectAdapter.ts`

## Completed Work

- Defined typed VFX definitions, instances, parameter schemas, quality/context
  imports, validation, and immutable registry behavior.
- Added pure adapters for all existing definitions and every schema 9 instance
  field without changing `MineMotionProject`.
- Preserved the inclusive legacy end frame and derived stable compatibility
  seeds without wall-clock/random entropy.
- Guarded reverse conversion against schema 9 data loss.
- Added focused registry, validator, adapter, timing, structured-clone, and
  project round-trip tests.
- Milestone 15.1 validation: 54 files and 141 tests; typecheck/build/audit green.
- Added fixed compatible hash vectors, versioned typed seed derivation, and a
  counter-addressed random sampler with no mutable generator state.
- Added pure frame evaluation with full validation, explicit inactivity,
  inclusive timing, resolved defaults, cloned primitive inputs, and four
  deterministic quality scales.
- Proved repeat/step/scrub/order/clone/JSON/schema 9 reload equivalence and
  blocked ambient random, UUID, crypto, and clock sources in focused tests.
- Milestone 15.2 validation: 56 files and 160 tests; typecheck/build/audit green.
- Added V1 renderer-neutral descriptor/output unions for particle emitter, beam,
  trail, expanding ring, and light pulse.
- Added safe plain-descriptor validation, hard allocation caps/warnings, finite
  output rejection, cloned placement, per-channel seeds, particle prefixes, and
  nested geometric quality sampling.
- Added adversarial tests for prototype-key qualities, inherited/class/accessor/
  non-enumerable descriptors, sparse/array-subclass tuples, cap/overflow/order/
  clone/JSON/no-entropy behavior, and the inclusive 15.2 integration path.
- Current validation: 58 files and 188 tests; typecheck/build/audit green.

## Unfinished Work

- No timeline editing path consumes typed VFX evaluation/primitive data yet.
- No advanced mesh/sprite/lightning/overlay/camera/modifier primitive kinds.
- No renderer, timeline, UI, project schema, or export consumer uses the typed
  VFX model yet.
- Preview/PNG/WebM parity and renderer resource leaks are tracked for 15.7/15.8.

## Known Error

Release Tauri build is blocked by Windows Smart App Control error 4551. Debug
MSI/NSIS succeeds. This does not block Phase 15.4 TypeScript work.

## Next Command

```powershell
git status --short --branch; git log -3 --oneline
```

## Next Implementation Step

Inventory real move/trim/duplicate/copy/paste/enable/order/select operations on
`track_effects_main`. Design one controller that mutates schema 9
`effects.instances`, synchronizes the existing lane, and commits through project
history. Do not introduce `project.vfx`, a second lane, or schema 10 yet.

## Tests To Run

```powershell
npm run typecheck
npm test -- --run src/vfx
npm test -- --run --reporter=dot
npm run build
npm audit --audit-level=high
```
