# Phase 16.3 - Lightning And Electric VFX

Phase 16.3 extends the Phase 16.2 native recipe path with a focused built-in
recipe registry. Combat and electric families resolve through one immutable
lookup; project persistence and primitive evaluation remain unchanged.

## Native family

- `electricStrike`: vertical jittered bolt, contact sparks, and light pulse.
- `electricStorm`: three deterministic area bolts with frame-seeded placement.
- `electricBeam`: focused long beam plus core pulse.
- `electricAura`: sphere sparks plus an expanding ring.
- `electricCharge`: gathering spark field, contracting ring, and core pulse.
- `electricSparks`: compact blue-white particle burst.
- `chainLightning`: three linked beams between deterministic control points.
- `electricWeaponTrail`: layered primary/core tapered trails.

All exposed parameters affect native output and are labelled live-preview in
the schema-generated Inspector. Recipes pass draft, medium, high, and final
quality evaluation without changing their deterministic sample hierarchy.

## Budgets and compatibility

Each preset declares a conservative final-quality frame budget. Runtime work is
measured from validated descriptors before the shared Phase 15 global allocator
allows primitive generation. A 60-storm regression scene deterministically
admits 48 effects (8,064 segments) and drops 12 before crossing the 8,192
segment limit.

The definitions use the existing EffectRegistry, schema 10 collection,
serializer/package paths, timeline, prepared frame, Three.js canvas, and export
capture. Schemas 1-9 and all compatibility/combat entries remain supported.
Electric entries stay `experimental` until cached thumbnails and the stable
preset regression gate are complete.
