# World Import Notes

Minecraft Java Edition worlds are folder-based. A typical save contains:

```text
MyWorld/
  level.dat
  region/
    r.0.0.mca
  DIM-1/
    region/
      r.0.0.mca
  DIM1/
    region/
      r.0.0.mca
```

## `level.dat`

`level.dat` stores world metadata in NBT, usually gzip-compressed. Useful fields
for MineMotion Studio include:

- world name
- spawn position
- game version
- data packs
- dimensions

Phase 1 detects `level.dat` but does not yet decode the compressed file in the
UI.

## Region Files

`.mca` files are Anvil region files. Each region covers 32 x 32 chunks. The file
starts with an 8192-byte header:

- first 4096 bytes: chunk location table
- next 4096 bytes: timestamps

Each location entry stores:

- sector offset
- sector count

Phase 1 includes helpers to parse region coordinates and read non-empty chunk
locations from the location table.

## Chunks

Chunks contain vertical sections. Modern chunk data stores block states using a
palette and packed bit arrays. To display a real world, the importer must:

1. Read a region file.
2. Locate chunk payloads.
3. Decompress chunk data.
4. Parse NBT.
5. Read sections and block state palettes.
6. Expand packed block indices.
7. Convert block IDs to render materials.
8. Build a mesh for the chosen area.

## Phase 1 Limits

- No full `.mca` chunk payload parsing.
- No gzip/zlib chunk decompression path wired into UI.
- No block state palette decoding.
- No real terrain mesh from world files.
- Imported worlds display the generated placeholder terrain while retaining the
  world scan summary.

## Phase 2 Plan

- Use a reliable NBT implementation or complete the internal reader.
- Add zlib/gzip decompression for `level.dat` and chunk payloads.
- Parse region headers and chunk records.
- Decode block palettes for a bounded chunk area.
- Mesh only visible faces first, then add greedy meshing.
- Keep world folders read-only.
- Add UI for selecting a small import area before loading.

