# Next Session

## Exact Current Task

Start Phase 17 milestone 17.3: define the versioned `.minemotion-vfx` manifest,
archive schema, and bounded safe extraction. Phase 17.2 is complete.

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
- VFX Studio opens from the main toolbar and creates blank or built-in-derived
  immutable drafts over existing Primitive V1 descriptors.
- The versioned authoring contract accepts only bounded primitive, emitter, and
  restricted modifier items; all 60 stable built-ins derive without mutation.
- Pure commands now add/reorder/duplicate/enable/edit/remove items and update
  target/duration/quality; restricted modifiers compile and preview for real.

## Unfinished Work

- Portable package schema/safety, deterministic import/export, installation,
  assets, restricted templates, examples, and documentation remain.

## Next Implementation Step

Define manifest and archive entry contracts, then implement strict validation
for paths, counts, compressed/uncompressed sizes, asset dimensions, and code.

## Tests To Run

```powershell
npm run typecheck
npm test -- --run src/vfx src/effects
npm test
npm run build
npm audit --audit-level=high
```
