# Phase 4: Real Minecraft World Import

Phase 4 moves MineMotion from generated Minecraft-like terrain to a real world
import MVP.

## Implemented

- Browser folder selection flow through **Open World**.
- `level.dat` reader for gzip NBT when `DecompressionStream` is available.
- Dimension detection:
  - Overworld: `region/`
  - Nether: `DIM-1/region/`
  - End: `DIM1/region/`
- Anvil `.mca` region coordinate and header parsing.
- Chunk payload extraction and gzip/zlib/uncompressed handling.
- Modern NBT reader for Java Edition tag types.
- Palette-based chunk section decoding.
- Block state fallback mapping for unknown blocks.
- Import limits for region files, chunks, and vertical sections.
- World Import modal with scan summary, dimension selector, chunk center/radius,
  import limits, progress, cancel, focus, and unload actions.
- Face-culling mesh pipeline with instanced block meshes.
- Viewport chunk borders and world origin helper.
- Schema v5 world metadata and optional imported chunk cache in `.minemotion`.

## Supported Blocks

- air
- grass_block
- dirt
- stone
- cobblestone
- deepslate
- oak_log
- oak_leaves
- water placeholder
- glass placeholder
- sand
- gravel
- snow
- netherrack
- end_stone
- common ores as colored placeholders
- unknown block fallback

## Tested Assumptions

The importer targets modern Java Edition Anvil worlds with palette-based chunk
sections. The fixtures cover NBT parsing, `.mca` header parsing, palette
decoding, face culling, and schema migration. No large real world fixture is
stored in the repository.
