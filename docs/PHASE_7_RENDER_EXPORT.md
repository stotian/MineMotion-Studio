# Phase 7: Production Render And Export

Phase 7 adds a project-backed render queue, deterministic frame stepping, final
camera playback, export validation, render estimates, browser outputs, and a
restricted native FFmpeg bridge.

## Implemented

- persistent render jobs with status, progress, logs, errors, and output path
- queue add, run, retry, remove, clear-finished, and cancellation controls
- final camera position, rotation, FOV, near plane, and far plane application
- deterministic sequential PNG capture with render-state restoration
- current-frame PNG and PNG sequence ZIP
- browser WebM with explicit video-only and live-resolution warnings
- frame-range WAV mixdown
- `.minemotion` package and audio metadata jobs
- desktop FFmpeg detection and user-configured executable/output directory
- H.264 MP4, H.265 MP4, ProRes MOV, and MP3 command plans
- temporary PNG/WAV staging through Tauri without invoking a command shell
- preflight camera, frame, format, asset, audio, post, VFX, and size checks

## Project Data

Schema v9 stores `renderQueue` and `ffmpegSettings`. A running job recovered
after application restart is returned to the queued state. Completed and failed
jobs retain up to 200 log entries each, with a default queue history of 30 jobs.

## Deterministic Rendering

Offline jobs stop playback, select the requested camera, clamp frames beyond the
project duration to the final frame, wait for two browser paints, capture the
viewport, and restore the original frame, playback state, render-preview state,
and active camera when finished.

## Honest Capability Boundary

Web mode never enables MP4, H.265, ProRes, or MP3. Native formats become valid
only after the desktop bridge confirms that the selected executable reports an
FFmpeg version and an output directory has been supplied.

MineMotion Studio does not bundle FFmpeg.

## Validated Limits

- The TypeScript command builder and restricted Rust bridge are covered by
  automated tests, but no real codec encode was run on the validation machine
  because FFmpeg is not installed there.
- Queue cancellation stops frame rendering and staging. Once FFmpeg itself has
  started, the current MVP waits for the process to finish.
- `tauri build --debug` produced working MSI and NSIS bundles on Windows. The
  release-profile build was blocked on the validation machine by Windows Smart
  App Control rejecting an unsigned Cargo build-script executable; no release
  installer is claimed from that attempt.
