# Blockbench Import Notes

The importer accepts current `.bbmodel` JSON with an `outliner`, plus the
legacy top-level `groups` representation. It applies explicit limits to source
size, cube count, hierarchy depth, groups, textures, clips, and report text
before the model reaches project persistence.

Static viewport geometry supports:

- cube bounds, inflation, and explicitly enabled faces
- nested group names and cube membership
- cube and group pivots
- cube and nested group rotations baked deterministically into OBJ vertices

Texture and animation metadata remain embedded in the original `.bbmodel` and
are summarized in the import report. Static OBJ preview deliberately uses the
MineMotion material, so the report identifies texture preview as unsupported.
Animation clips are named and counted. Unique normalized bone names and a small
reviewed alias table map automatically; conflicts and unknown names require a
preset-scoped manual choice. Numeric rotation keys can be converted into
deterministic reusable clips and applied through the existing global timeline.
Position/scale channels, advanced interpolation, and executable expressions
remain unsupported and produce stable warnings.

`project.assets.blockbench` is the authoritative asset collection. The legacy
`project.rigs.blockbenchModels` collection is sanitized and reconciled as a
compatibility projection during serialization and migration.

The parser does not execute Blockbench expressions, scripts, or plugin data.
