# Next Session

## Exact Current Task

Start Phase 16 milestone 16.3: build the lightning/electric preset family over
the validated native recipe runtime. Phase 16.2 combat VFX is complete.

## Completed Work

- Phase 15 complete at `7dc093b`.
- Versioned native recipe preflight reuses the current primitive evaluator and
  global budget; descriptors are validated, cloned, frozen, and summed before
  any primitive allocation.
- Eight combat entries are editable and usable in timeline, preview, save/load,
  and export: sparks, impact, slash, parry, slam, landing, critical, hit stop.
- Hit stop freezes animation sampling without rewinding VFX/environment time.
- Combat presets remain experimental until generated thumbnails and stable
  regression coverage are complete; stable count remains zero.

## Unfinished Work

- Lightning/electric and later content families.
- Search/favorites/recents, preview caching, 60 stable total,
  and benchmark/regression scenes remain Phase 16 work.

## Next Implementation Step

Add strike, storm, beam, aura, charge, sparks, chain, and weapon-trail recipes.
Extend the current combat recipe registry into a focused built-in recipe
registry without changing project persistence or evaluator ownership.

## Tests To Run

```powershell
npm run typecheck
npm test -- --run src/vfx src/effects
npm test
npm run build
npm audit --audit-level=high
```
