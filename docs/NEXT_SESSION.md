# Next Session

## Exact Current Task

Start Phase 17 milestone 17.1: create the dedicated VFX workspace and safe
stack-authoring contracts. Phase 16 is complete.

## Completed Work

- Phase 15 complete at `7dc093b`.
- One built-in recipe registry resolves 60 native recipes across all required
  Phase 16 content families.
- The catalog contains 72 total entries and every movement parameter has an
  output-influence regression.
- Search, category/tags/source filters, 128 favorites, and 20 recents are live.
- Exactly 60 native presets are stable with deterministic cached previews and
  full integration verification; 12 compatibility entries remain non-stable.
- Four benchmark/regression project fixtures lock dense budget behavior.
- Exactly 60 native presets are stable after deterministic previews and complete
  integration/regression coverage; 12 compatibility entries remain non-stable.

## Unfinished Work

- Phase 17 authoring, derived presets, portable package safety, installation,
  restricted templates, examples, and documentation remain.

## Next Implementation Step

Define a dedicated workspace shell and typed stack model for supported
primitives/emitters/modifiers. Do not add a node graph or executable content.

## Tests To Run

```powershell
npm run typecheck
npm test -- --run src/vfx src/effects
npm test
npm run build
npm audit --audit-level=high
```
