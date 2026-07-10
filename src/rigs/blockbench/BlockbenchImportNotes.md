# Blockbench Import Notes

Phase 5 supports a clean `.bbmodel` MVP:

- read JSON files exported by Blockbench
- validate the `elements` cube array
- collect groups, textures, and metadata
- convert static cubes into OBJ geometry for viewport preview

Rig mapping is intentionally prepared but not automatic yet. Future work should
map Blockbench groups to MineMotion bone IDs when names are compatible.
