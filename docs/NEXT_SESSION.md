# Next Session

## Exact Current Task

Start Phase 17 milestone 17.6: safe package asset handlers and restricted shader
template validation/fallback. Phase 17.5 is complete.

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
- Closed manifest V1 and bounded ZIP32 extraction now reject unsafe paths,
  code, archive bombs, undeclared assets, invalid metadata, and bad budgets.
- Canonical byte-stable ZIP export, round-trip rewrite, and pre-install preview/
  dependency/permission/license/asset/budget reports are live in VFX Studio.
- A bounded versioned local registry now installs, updates, enables, disables,
  inspects, and uninstalls canonical packages with dependency protection.

## Unfinished Work

- Safe typed asset consumption, restricted templates, installed custom effect
  integration, examples, and author documentation remain.

## Next Implementation Step

Validate/resolve all supported asset kinds from package entries, then define a
closed restricted shader template schema with safe fallback and no source code.

## Tests To Run

```powershell
npm run typecheck
npm test -- --run src/vfx src/effects
npm test
npm run build
npm audit --audit-level=high
```
