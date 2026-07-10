# Project Schema

Current project files use `schemaVersion: 6`.

## Added In Schema 6

- Minecraft rig preset IDs and model type metadata
- character skin asset references and validation metadata
- attachment points and placeholder attachment data
- per-character bone keyframe caches
- global `bone.rotation.*` animation tracks
- rig timeline lane
- saved rig poses and rig animation clips
- Blockbench model metadata and raw JSON assets

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

- v1 -> v6
- v2 -> v6
- v3 -> v6
- v4 -> v6
- v5 -> v6
- v6 round-trip

Missing Phase 2, Phase 3, Phase 4, and Phase 5 fields are filled with safe
defaults.
Invalid legacy projects that lack core scene, animation, or asset data are
rejected.

## Timeline Lanes

Typed lanes:

- transform
- rig
- effect
- audio
- postProcessing

Effect and audio lanes are synchronized from `effects.instances` and
`audio.clips`. Rig lanes are synchronized from `bone.rotation.*` tracks.

## Package Metadata

Schema v4 adds package metadata so the project can be saved inside a
`.minemotion` payload:

- preferred package extension
- last package id
- last packaged timestamp
- package warnings

The current `.minemotion` writer stores JSON, OBJ assets, skin data URLs,
Blockbench raw JSON, audio data URLs, and an asset library index in a single
JSON payload. Schema v5 adds imported world metadata and optional imported
chunk cache data. Schema v6 adds rig, skin, pose, and Blockbench data.
