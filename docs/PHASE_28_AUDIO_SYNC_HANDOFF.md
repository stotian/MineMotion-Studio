# Phase 28 — Audio synchronization and handoff

Status: **LOCAL_COMPLETE**

## Delivered

- Audio schema v2 with source offsets, fades, gain, pan, mute, role, peak,
  loudness, waveform identity and decode health.
- Backward-compatible migration of legacy clip-only projects.
- Frame-accurate playback resynchronization during play, pause and scrub.
- Shared deterministic gain-envelope rules between viewport playback and WAV
  mixdown.
- Asynchronous concurrency-safe waveform generation with bounded buckets,
  cancellation and an LRU-style cache contract.
- Dialogue, SFX, music and ambience roles plus dialogue/beat/action/sync
  markers.
- Manual or imported phoneme/lip-sync cues with bounded parsing and warnings.
- Cancellable deterministic WAV mixdown with source offsets, fades, pan,
  master gain, role filtering and decode reuse.
- Audio handoff metadata and full-mix/dialogue/SFX/music/ambience stem plans.
- Audio workspace for timing, role, mute, fade and marker editing.
- Missing, corrupt, clipping and loudness warnings.

## Scope boundary

MineMotion remains an animation and rendering application. It provides precise
synchronization and external-editor handoff, but does not claim multitrack NLE,
noise reduction, spectral repair or destructive waveform editing.

## Validation

- Strict targeted TypeScript check of audio schema, waveform, playback rules,
  mixdown, handoff and project migration.
- Runtime checks for schema migration, fade envelopes, waveform analysis and
  cache behavior.
- Acceptance tests cover lip-sync import and role-separated stem metadata.
- Static syntax/import/localization and architecture gates pass.

Full browser OfflineAudioContext and FFmpeg integration tests remain part of the
blocked dependency-backed gate.
