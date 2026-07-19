# Next Session

## Exact Current Task

Start Phase 16 milestone 16.8: build the movement/trail preset family. Phase
16.7 screen/cinematic VFX is complete.

## Completed Work

- Phase 15 complete at `7dc093b`.
- One built-in recipe registry resolves 16 native combat/electric recipes.
- Electric strike, storm, beam, aura, charge, sparks, chain, and weapon trail
  pass deterministic evaluation at all four quality levels.
- A dense-storm regression proves deterministic pre-allocation segment capping.
- Native presets remain experimental until generated thumbnails and stable
  regression coverage are complete; stable count remains zero.

## Unfinished Work

- Movement/trail and later library milestones.
- Search/favorites/recents, preview caching, 60 stable total,
  and benchmark/regression scenes remain Phase 16 work.

## Next Implementation Step

Add dash, weapon, projectile, footsteps, running, falling, and flying trails.

## Tests To Run

```powershell
npm run typecheck
npm test -- --run src/vfx src/effects
npm test
npm run build
npm audit --audit-level=high
```
