# Phase 19.12 - Blockbench Import Fidelity and Reports

## Status

COMPLETE

## Source contract and limits

The parser accepts current `.bbmodel` outliners and the legacy top-level groups
representation. It bounds JSON size, cubes, groups, hierarchy depth, textures,
animation clips, and text before data reaches the project.

Cube vectors, origins, rotations, inflation, faces, group pivots, and nested
children are validated. Stable diagnostic codes identify missing, skipped,
truncated, unsupported, or mapping-dependent data.

## Static geometry

OBJ conversion is deterministic for identical source JSON. It:

- applies cube inflation and explicitly enabled faces;
- carries nested group names into object groups;
- rotates cubes around their own pivots;
- composes nested group rotations around their pivots; and
- normalizes finite vertex formatting for stable output.

Texture metadata is retained, but the static preview continues to use the
MineMotion material. This is visible in the report rather than silently
presented as texture support.

## Clips and reports

Animation clips are bounded, counted, and named in the stored asset report.
They remain in the original JSON with animator data intact. Import reports show
model/format versions, cube/group/texture counts, clip names, warnings, and
features requiring follow-up.

Clip-to-rig mapping is deliberately assigned to Phase 19.13. Phase 19.12 does
not invent mappings or a Blockbench-specific timeline.

## Persistence

`project.assets.blockbench` is authoritative. The former
`project.rigs.blockbenchModels` collection is sanitized and synchronized as a
compatibility projection. Reports are recomputed from bounded raw JSON at
persistence boundaries.

JSON, project packages, browser autosave, schema 9 migration, and history
preserve the reconciled asset. Imports remain one existing history operation.

## Validation

- Focused parser/contract/persistence tests: 3 files, 23 tests.
- Full frontend suite: 114 files, 516 tests.
- Typecheck, localization, VFX examples, architecture, build, and audit pass.
- Build: 1,862 modules; known 1,490.42 kB large chunk.
- `App.tsx` remains below the Phase 19 baseline at 2,676 lines.
