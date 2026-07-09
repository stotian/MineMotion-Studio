# World Import Limitations

Phase 4 is a real import MVP, not a full Minecraft renderer.

## Current Limits

- No resource-pack texture loading.
- No biome tinting yet.
- Heightmaps are not used for rendering decisions yet.
- Entities, tile entities, fluids simulation, lighting, and block models are not
  decoded.
- Older non-palette chunk formats are not fully supported.
- Compressed payloads require browser `DecompressionStream` support.
- `.minemotion` stores metadata and optional imported chunk cache, not the full
  source Minecraft world.

## Performance Limits

The importer defaults to small bounded imports. Increase limits carefully:

- max region files
- max chunks
- max vertical sections

Large imports can create many block instances and increase browser memory use.
