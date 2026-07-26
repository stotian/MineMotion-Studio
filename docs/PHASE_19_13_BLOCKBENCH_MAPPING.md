# Phase 19.13 - Blockbench Rig and Clip Mapping

## Status

COMPLETE

## Mapping policy

Automatic mapping accepts only:

- a unique normalized match to a real target bone ID; or
- a unique match from the reviewed Minecraft-oriented alias table.

Multiple source groups resolving to one target become conflicts. Unknown groups
remain unmapped. Rig Studio exposes every bounded source group and target bone,
allows a preset-scoped manual choice, permits an explicit manual exclusion, and
can restore the derived automatic result.

Only manual decisions persist. Automatic results remain deterministic derived
data over the imported outliner and selected rig definition.

## Animation conversion

Blockbench animator UUIDs resolve to source groups first; a unique animator name
is the fallback. Supported finite rotation data converts from seconds to the
project FPS and produces deterministic reusable clip/key IDs.

The importer accepts numbers and plain numeric strings. It does not evaluate
Molang, JavaScript, plugin expressions, or other executable values. Position,
scale, non-bone channels, duplicate animator targets, and advanced interpolation
are skipped or approximated with stable warnings.

Applying a mapped clip:

- rejects missing or locked characters and invalid ranges atomically;
- upserts one existing reusable clip;
- writes the authoritative global bone tracks at the playhead;
- synchronizes the existing rig lane; and
- uses one whole-project history checkpoint.

There is no Blockbench-specific timeline or per-key undo entry. Reapplying the
same converted clip at the same frame is a no-op.

## Persistence and production

Preset-scoped manual mappings and converted clips survive JSON, project
packages, browser autosave, schema 9, and history. Production Animator sampling
reads the same baked global tracks used by preview and export.

## Validation

- Focused Blockbench mapping/parser/contract/persistence tests: 4 files,
  27 tests.
- Full frontend suite: 115 files, 520 tests.
- Typecheck, localization, VFX examples, architecture, build, and audit pass.
- Build: 1,867 modules; known 1,509.40 kB large chunk.
- `App.tsx` remains at the Phase 19 checkpoint of 2,676 lines.
