# Phase 19.7 - Animation Layers

## Status

IN_PROGRESS

## Pure contract checkpoint

The first Phase 19.7 checkpoint defines six ordered bounded layer kinds:

1. Base Animation
2. Upper Body
3. Head Look
4. Hand Adjustment
5. Additive Motion
6. VFX Synchronization

Every animation layer has one target, mute, weight, a fixed blend mode, bounded
references to existing reusable/NLA clips, and optional VFX effect-ID metadata
only on the synchronization layer. Override/additive/metadata modes are derived
from the layer kind rather than accepted as arbitrary input.

The pure evaluator starts from existing sampled global values, then applies
active clip instances in fixed layer order:

- Base and Additive Motion may affect all transform/bone properties.
- Upper Body is limited to body, cape, head, arms, and forearms.
- Head Look affects only `bone.rotation.head`.
- Hand Adjustment affects arms and forearms.
- Additive Motion treats clip values as motion relative to the clip's first
  sample, avoiding an absolute-value jump at activation.
- VFX Synchronization reports deduplicated effect references and does not create
  another effect timing authority.

Layer and clip weights multiply. Muted/out-of-range instances do nothing;
missing clips produce deterministic warnings. Inputs are bounded plain data and
accessors are not invoked.

## Remaining

- adapt existing `animation.nlaTracks` as the persisted layer containers;
- evaluate layers after global tracks in playback, scrub, preview, and export;
- add localized layer mute/weight/additive UI over the current NLA surface;
- persist and validate VFX references without duplicating effect timing;
- cover schema 10, guarded schema 9, history, autosave, and package round trips.

## Validation

- Focused layer/clip/interpolation tests: 3 files, 9 tests.
- Full frontend suite: 106 files, 478 tests.
- Typecheck, locales, VFX examples, architecture, build, and audit pass.
