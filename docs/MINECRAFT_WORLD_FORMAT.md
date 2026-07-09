# Minecraft World Format Notes

MineMotion Phase 4 reads the Java Edition world layout:

```text
level.dat
region/r.<x>.<z>.mca
DIM-1/region/r.<x>.<z>.mca
DIM1/region/r.<x>.<z>.mca
```

## NBT

NBT tags are read as big-endian payloads. The reader supports byte, short, int,
long, float, double, byte array, string, list, compound, int array, and long
array.

`level.dat` is usually gzip-compressed. Browser `DecompressionStream` support is
required for compressed reads in the current web runtime.

## Anvil Regions

`.mca` files contain:

- 4096-byte location table
- 4096-byte timestamp table
- chunk sectors

Each location entry stores a 3-byte sector offset and 1-byte sector count.
Chunk payloads include a 4-byte length, 1-byte compression type, then compressed
NBT data.

## Chunk Sections

The Phase 4 reader supports palette-based block states:

- `sections[].block_states.palette`
- `sections[].block_states.data`

Older pre-flattening block ID formats are not fully decoded.
