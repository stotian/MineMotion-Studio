# Phase 20.13 — Timeline module split

## Scope

`TimelinePanel.tsx` was characterized before extraction. The refactor moves only
presentation-owned Timeline and NLA views while keeping project state, playback,
selection, commands, and whole-project history in their existing owners.

## Result

- `TimelinePanel.tsx`: 1,411 to 973 lines.
- Reviewed ceiling: 1,000 lines through `npm run verify:architecture`.
- `TimelineViews.tsx` owns Timeline/NLA JSX and drag presentation.
- `TimelineViewModel.ts` owns pure duration, tick, marker, visibility, disabled
  effect, and percentage-style calculations.
- `TimelineConstants.ts` owns shared bounded layer constants.

## Characterization coverage

The focused tests preserve the 21 rounded ruler ticks, first-seen keyframe
marker ordering, structural empty lanes, disabled-effect derivation, and the
existing minimum one/two percent item widths.

## Authority rule

No child view stores canonical timeline data. Effects still mutate through
`EffectTimelineController`; NLA changes and history still enter through the
callbacks supplied by `TimelinePanel`.
