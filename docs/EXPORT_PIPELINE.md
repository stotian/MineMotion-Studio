# Export Pipeline

The Phase 3 export pipeline is browser-first and uses the live viewport canvas.

## Supported Outputs

- `png_frame`: captures the current viewport into one PNG.
- `png_sequence`: advances the timeline frame by frame and stores numbered PNGs
  in a ZIP archive.
- `webm_video`: records the live viewport canvas through browser
  `MediaRecorder` where supported.
- `wav_audio`: renders project audio through `OfflineAudioContext` where
  supported.
- `mp4_video`: validated as unsupported until a future FFmpeg/native pipeline.

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
