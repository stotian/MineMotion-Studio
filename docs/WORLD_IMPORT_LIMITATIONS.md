# World Import Support Matrix And Limitations

Phase 21 is a bounded animation-set importer, not a Minecraft server or complete
world editor.

## Supported production path

| Area | Status |
| --- | --- |
| Current Java Anvil region discovery | Supported |
| Overworld, Nether, End, custom dimension folders | Supported |
| Modern palette/state properties | Supported |
| Negative Y and current world height | Supported |
| Modern padded and legacy continuous packed states | Supported |
| Corrupt chunk/region isolation | Supported with warnings |
| Coordinate/radius/region/chunk preview selection | Supported |
| Spawn defaults and saved import profiles | Supported |
| Cancellation, estimates, reimport, changed-chunk reuse, unload | Supported |
| Source-world writes | Never performed |
| ZIP/folder resource packs and per-face textures | Supported within limits |
| Vertical-strip `.png.mcmeta` animations | Supported |
| Transparent/emissive/water/leaves/biome tint fallbacks | Supported |
| Time, sun, moon, fog, rain, snow, storm, Nether/End moods | Supported |
| Scene-only props/visibility/markers/anchors/collision | Supported |
| Versioned embedded portable chunk cache | Supported |
| Reference-only world package | Supported; source must be reselected |

## Not supported or intentionally partial

- Complete pre-flattening numeric ID/data compatibility.
- Entities, block entities, structures, POI, maps, ticks, inventories, commands,
  redstone simulation, fluid simulation, or world saving.
- Arbitrary resource-pack block models, multipart/model predicates, connected
  textures, custom shaders, OptiFine/CIT, or mod render APIs.
- ZIP64 or encrypted resource-pack archives.
- Automatic reopening of a local browser folder after a reference-only project
  is closed; the user must reselect the source.
- Pixel-identical Minecraft lighting, biome blending, water shaders, or weather.

## Safety and performance bounds

The importer limits region files, chunk candidates, decoded chunks, vertical
sections, NBT collections/depth, resource-pack entries/expanded bytes, cache
chunks/blocks/states, and preview radius. Large embedded caches warn at 64 MiB
and become critical at 256 MiB. These are guardrails, not promises that every
machine can render the maximum safely.
