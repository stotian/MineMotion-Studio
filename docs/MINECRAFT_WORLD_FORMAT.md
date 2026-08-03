# Minecraft Java World Format Support

MineMotion reads selected Java Edition world areas from browser-provided files.
The source is always treated as read-only.

## Discovered layout

```text
level.dat
region/r.<x>.<z>.mca
DIM-1/region/r.<x>.<z>.mca
DIM1/region/r.<x>.<z>.mca
dimensions/<namespace>/<path>/region/r.<x>.<z>.mca
```

The first three dimensions map to Overworld, Nether, and End. Additional valid
`dimensions/.../region` folders are retained as `custom:<namespace>:<path>`
dimensions.

## NBT

The bounded big-endian reader supports byte, short, int, long, float, double,
byte array, string, list, compound, int array, and long array tags. Depth and
collection limits reject hostile lengths before large allocations. `level.dat`
and chunk payload decompression use the available gzip/zlib runtime adapters.

## Anvil regions

Each `.mca` region contains a 4 KiB location table, 4 KiB timestamp table, and
sector-aligned chunk payloads. MineMotion validates file boundaries and the
sector allocation recorded for each payload. A bad location or payload is
reported for that region/chunk without discarding already decoded neighbors.

## Modern chunks

Supported section data includes:

- `sections[].block_states.palette` names and state properties;
- `sections[].block_states.data` using modern padded packing;
- older continuous packed long arrays where required by historical palettes;
- negative section Y and modern `-64..319` height;
- chunk `DataVersion` and `Status`;
- biome palettes, legacy biome arrays, and numeric heightmaps.

Unknown or modded states retain their Minecraft name/properties and render with
a deterministic unknown-block material until mapped.

## Deliberate boundaries

MineMotion does not fully decode pre-flattening numeric block arrays, entities,
block entities, structures, POI, redstone/fluid simulation, arbitrary block
models, or mod-specific render APIs. It never writes data back to the world.
