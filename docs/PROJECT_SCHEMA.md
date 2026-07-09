# Project Schema

Current project files use `schemaVersion: 4`.

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

- v1 -> v4
- v2 -> v4
- v3 -> v4
- v4 round-trip

Missing Phase 2 and Phase 3 fields are filled with safe defaults. Invalid
legacy projects that lack core scene, animation, or asset data are rejected.

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
an asset library index in a single JSON payload.
