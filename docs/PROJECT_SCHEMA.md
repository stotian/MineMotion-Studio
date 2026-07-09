# Project Schema

Current project files use `schemaVersion: 3`.

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

- v1 -> v3
- v2 -> v3
- v3 round-trip

Missing Phase 2 fields are filled with safe defaults. Invalid legacy projects
that lack core scene, animation, or asset data are rejected.

## Timeline Lanes

Phase 2 adds typed lanes:

- transform
- effect
- audio
- postProcessing

Effect and audio lanes are synchronized from `effects.instances` and
`audio.clips`.
