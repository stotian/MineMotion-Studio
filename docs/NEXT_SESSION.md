# Next Session

## Exact Current Task

Start Phase 16 milestone 16.2: define reusable native preset recipes and build
the combat preset family. Phase 15 and milestone 16.1 are complete.

## Completed Work

- Phase 15 complete at `7dc093b`.
- Phase 16.1 typed/frozen catalog metadata over existing registries.
- Fail-closed validation covers IDs, schema, localization, thumbnail assets,
  categories/tags, duration, qualities, compatibility, stable claims, and work.
- Effects Library consumes catalog entries; unavailable experimental entries are
  disabled and current compatibility entries do not count as stable.
- Validation: focused 17 files/177 tests; full 71 files/323 tests;
  typecheck/build (1,784 modules)/audit green.

## Unfinished Work

- Define a native preset recipe/composition contract over existing primitives.
- Add sparks, impacts, slashes, parry, slam, landing, critical, and hit-stop
  presets with honest preview/export support.
- Later families, search/favorites/recents, preview caching, 60 stable total,
  and benchmark/regression scenes remain Phase 16 work.

## Next Implementation Step

Design a versioned recipe union that references validated VFX definitions and
bounded primitive descriptors. Reuse `evaluateVfxPrimitive`; do not introduce a
second frame evaluator or project collection.

## Tests To Run

```powershell
npm run typecheck
npm test -- --run src/vfx src/effects
npm test
npm run build
npm audit --audit-level=high
```
