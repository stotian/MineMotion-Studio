# Phase 19.7 - Animation Layers

## Status

COMPLETE

## Implementation

Phase 19.7 defines six ordered bounded layer kinds:

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

The existing `animation.nlaTracks` collection is the only persisted layer
container. Missing layer fields from older projects migrate to a Base Animation
layer, so schema 10 and guarded schema 9 remain compatible without introducing
another project authority. Layer kind fixes blend mode; layer and clip edits
are bounded, and a target has at most one layer of each kind.

`sampleProjectWithAnimationLayers` evaluates the authoritative global tracks
first and then composes the target's ordered NLA layers. The shared
playback/scrub/preview/export path uses this sampler. Foot lock, look-at bake,
and motion paths also use the same composition, preventing tool-preview drift.
Motion paths remap clip-local keys through NLA start and time scale.

The localized NLA surface can:

- choose Base, Upper Body, Head Look, Hand Adjustment, or Additive Motion when
  inserting a compatible reusable clip;
- mute a layer and edit its bounded weight;
- retain clip-instance mute/weight behavior;
- create one VFX Synchronization layer and select bounded existing effect IDs.

VFX synchronization remains metadata only. Effect start, duration, parameters,
and timeline order continue to live in `effects.instances`.

## Validation

- Focused layer/editor/motion/persistence tests: 4 files, 16 tests.
- Schema 10, guarded schema 9, package, autosave, history undo/redo, preview,
  export sampling, and fractional motion-path keys are covered.
- Full frontend suite: 107 files, 484 tests.
- Typecheck, locales, VFX examples, architecture, build, and audit pass.
- `App.tsx` remains 2,678 lines.
