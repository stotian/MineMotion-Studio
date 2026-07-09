# Project Schema

Current project files use `schemaVersion: 5`.

## Added In Schema 5

- imported Minecraft chunk cache metadata
- selected world dimension
- imported chunk ranges
- unknown block mappings and count
- world import performance estimate
- chunk border and world origin render options

## Added In Schema 4

- `packageMetadata`
- `assetLibrary`
- `exportSettings`
- `performanceSettings`
- `.minemotion` package save/load support

## Added In Schema 3

- `activeCameraId`
- `effects.instances`
- `audio.clips`
- `postProcessing`
- `renderSettings`
- `animation.timelineTracks`
- camera `active`
- camera `focalLength`

## Migration

The serializer supports:

- v1 -> v5
- v2 -> v5
- v3 -> v5
- v4 -> v5
- v5 round-trip

Missing Phase 2, Phase 3, and Phase 4 fields are filled with safe defaults.
Invalid legacy projects that lack core scene, animation, or asset data are
rejected.

## Timeline Lanes

Typed lanes:

- transform
- effect
- audio
- postProcessing

Effect and audio lanes are synchronized from `effects.instances` and
`audio.clips`.

## Package Metadata

Schema v4 adds package metadata so the project can be saved inside a
`.minemotion` payload:

- preferred package extension
- last package id
- last packaged timestamp
- package warnings

The current `.minemotion` writer stores JSON, OBJ assets, audio data URLs, and
an asset library index in a single JSON payload. Schema v5 adds imported world
metadata and optional imported chunk cache data.
