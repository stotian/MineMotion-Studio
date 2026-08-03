# Phase 21 — Production Minecraft World And Environment Pipeline

## Outcome

Phase 21 upgrades the bounded Phase 4 importer into a recoverable production
set workflow. MineMotion still does not edit a Minecraft save. It reads selected
Java Edition data, converts it to renderer-neutral project data, and stores all
scene changes in the MineMotion project.

## World format and reliability

The importer now supports the modern Anvil/NBT paths used by current Java
Edition worlds:

- big-endian NBT primitives, compounds, bounded lists and arrays;
- gzip/zlib/uncompressed chunk payloads through the existing runtime adapters;
- modern section palettes and block-state properties;
- both modern padded and older continuous packed long arrays;
- negative section Y and the `-64..319` world-height range;
- `DataVersion`, chunk status, biome palettes, legacy biome IDs, and heightmaps;
- Overworld, Nether, End, and discovered custom dimension region folders;
- unknown blocks through deterministic fallback materials and reports.

NBT collection sizes, nesting, region sectors, chunk counts, region counts,
vertical sections, resource-pack entries, and cache collections are bounded.
A malformed region or chunk becomes a local warning; valid neighboring chunks
continue importing.

## Selection and lifecycle

World Import provides:

- spawn-centered defaults after `level.dat` scanning;
- manual chunk coordinates and radius;
- region buttons and a clickable top-down chunk preview;
- conservative region/chunk/block/memory estimates before import;
- cancellable latest-operation scanning and decoding;
- reusable saved import profiles;
- changed-chunk reimport using content fingerprints;
- selected-area unload and cache invalidation.

All source access is read-only. MineMotion never writes `level.dat`, `.mca`,
resource-pack, or source-world files.

## Resource packs and materials

ZIP and browser-folder resource packs share one bounded scanner. It resolves
per-face block textures, parses supported `.png.mcmeta` animation timing, plays
vertical-strip animations on the project timeline, and reports every fallback.
Common transparent, leaf, water, glass, emissive, biome-tinted, and unknown
materials use explicit presets rather than silently becoming opaque stone.

Unsupported pack features remain honest: ZIP64, encrypted archives, arbitrary
block-model JSON, connected textures, custom shaders, and mod-specific renderers
are not interpreted.

## Environment and staging

Lighting and Sky now include animation-ready sun and moon direction, time of
day, fog, rain, snow, storm, deterministic wind/precipitation, and Nether/End
mood presets. The same project frame drives preview and export preparation.

MineMotion-only staging data can hide imported chunks, place temporary block
props, and add markers, VFX anchors, or collision helpers. These overrides are
serialized separately from imported Minecraft data.

## Portable world cache

When embedding is enabled, `.minemotion` stores selected chunks once in a
renderer-neutral palette/int32 cache asset. The cache has:

- a versioned format and codec;
- content fingerprint verification;
- bounded states, chunks, and blocks;
- warning and critical package-size levels;
- package rehydration without the original folder.

When embedding is disabled, runtime chunks remain visible in the current
session but are removed from the saved package. The package keeps the source
reference and a clear note that the read-only world must be selected again to
rebuild the cache. Missing or corrupt embedded caches open in a degraded state
with warnings instead of making the whole project unreadable.

## Acceptance evidence

Available local validation includes:

- syntax transpilation for every changed TypeScript/TSX file;
- strict focused typechecks for parser/import/cache/package and UI-controller
  boundaries;
- executable smoke checks for modern/legacy block packing, NBT limits, corrupt
  chunk isolation, deterministic weather, scene overrides, import profiles,
  portable cache fingerprints, and package round-trips;
- locale key parity and duplicate checks;
- `git diff --check` and architecture ceilings.

The complete locked `npm ci`, Vitest, Vite build, audit, browser visual smoke,
and remote CI remain required when the configured registry and GitHub write
access are available.

## Explicit unsupported legacy formats

- pre-flattening numeric block ID/data arrays are not a complete compatibility
  renderer;
- entities, block entities, scheduled ticks, structures, maps, and POI data are
  not imported as editable scene objects;
- arbitrary modded dimensions can be discovered, but unknown blocks/models use
  fallbacks;
- the source world is never saved back from MineMotion.
