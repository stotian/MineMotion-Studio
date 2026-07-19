# Next Session

## Exact Current Task

Start Phase 16 milestone 16.4: build the fire/explosion preset family over the
validated native recipe runtime. Phase 16.3 electric VFX is complete.

## Completed Work

- Phase 15 complete at `7dc093b`.
- One built-in recipe registry resolves 16 native combat/electric recipes.
- Electric strike, storm, beam, aura, charge, sparks, chain, and weapon trail
  pass deterministic evaluation at all four quality levels.
- A dense-storm regression proves deterministic pre-allocation segment capping.
- Native presets remain experimental until generated thumbnails and stable
  regression coverage are complete; stable count remains zero.

## Unfinished Work

- Fire/explosion and later content families.
- Search/favorites/recents, preview caching, 60 stable total,
  and benchmark/regression scenes remain Phase 16 work.

## Next Implementation Step

Add fire, smoke, explosion, embers, debris, dust, Nether fire, and soul fire
definitions/recipes without changing project persistence or evaluator ownership.

## Tests To Run

```powershell
npm run typecheck
npm test -- --run src/vfx src/effects
npm test
npm run build
npm audit --audit-level=high
```
