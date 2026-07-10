# Project Schema

Current project files use `schemaVersion: 7`.

## Added In Schema 7

- imported resource pack metadata and selected block texture assets
- active resource pack and texture-filtering settings
- Minecraft material preset overrides
- biome tint placeholder settings
- Lighting Studio sun, ambient, shadow, fog, and time-of-day settings
- environment keyframes for lighting and post-processing values
- Lighting & Sky timeline lane

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

- v1 -> v7
- v2 -> v7
- v3 -> v7
- v4 -> v7
- v5 -> v7
- v6 -> v7
- v7 round-trip

Missing Phase 2, Phase 3, Phase 4, Phase 5, and Phase 8 fields are filled with safe
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
- sky

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
chunk cache data. Schema v6 adds rig, skin, pose, and Blockbench data. Schema
v7 adds resource packs, materials, lighting, atmosphere, and environment keys.
