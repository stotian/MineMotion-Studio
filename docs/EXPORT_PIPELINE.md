# Export Pipeline

The production pipeline supports browser downloads and a desktop FFmpeg bridge.

## Supported Outputs

- `png_frame`: captures the current viewport into one PNG.
- `png_sequence`: advances the timeline frame by frame and stores numbered PNGs
  in a ZIP archive.
- `webm_video`: records canonical composited captured frames at requested
  resolution through browser `MediaRecorder` where supported.
- `wav_audio`: renders project audio through `OfflineAudioContext` where
  supported.
- `minemotion_package`: writes a portable MineMotion project package.
- `audio_metadata`: writes clip/timing metadata as JSON.
- `mp4_h264`, `mp4_h265`, `prores_video`, and `mp3_audio`: desktop-only,
  enabled after FFmpeg detection.

## Settings

Export settings are stored in the project:

- output name
- format
- start and end frame
- FPS
- width and height
- transparency
- post-processing flag
- VFX overlay flag
- cinematic bars flag
- audio flag
- camera target
- quality

## Frame Sequence

PNG sequence export:

1. snapshots the current frame/playback state
2. moves to each requested frame
3. waits for the viewport to repaint
4. captures the canvas to PNG
5. writes a stored ZIP archive
6. restores the original timeline state

Cancellation is checked between frames.

Production jobs are persisted in schema v10 with status, progress, logs, and
errors. See `RENDER_QUEUE.md` and `FFMPEG_EXPORT.md`.
