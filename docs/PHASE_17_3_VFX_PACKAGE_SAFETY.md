# Phase 17.3 - Portable VFX Package Safety

`.minemotion-vfx` is a ZIP32 archive with exactly one root `manifest.json`, one
root `effect.json`, and only manifest-declared asset files. Manifest V1 records
semantic package/Studio versions, stable IDs, author/license, effect identity,
bounded dependencies, explicit asset permissions, and typed asset metadata.

The reader rejects unsafe paths, explicit directories, case-folded duplicates,
undeclared files, executable/script/WASM extensions, unrestricted shader files,
encryption, ZIP64, multi-disk archives, unsupported flags/compression, symlinks,
bad UTF-8, local/central mismatches or overlaps, CRC/size mismatches, excessive
archive/entry/expanded sizes, unsafe compression ratios, and excessive counts.

PNG image declarations are limited to 4096x4096 and checked against signature,
IHDR CRC, and actual dimensions. Manifest versions, semantic versions, package/
asset licenses, dependency IDs/ranges, permissions, MIME types, byte lengths,
and closed field sets fail validation. `effect.json` must be a valid authoring
document whose ID matches the manifest and whose compiled stack fits runtime
budgets. Extraction remains in memory and performs no install or filesystem I/O.
