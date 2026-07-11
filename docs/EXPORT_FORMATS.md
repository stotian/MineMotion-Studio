# Export Formats

| Format | Web | Desktop | Audio | Notes |
| --- | --- | --- | --- | --- |
| PNG current frame | Yes | Yes | No | Uses requested width and height. |
| PNG sequence ZIP | Yes | Yes | No | Deterministic numbered frames. |
| WebM | When MediaRecorder is available | Yes | No | Records live viewport resolution. |
| WAV | When OfflineAudioContext is available | Yes | Audio only | Mixes the selected frame range. |
| `.minemotion` | Yes | Yes | Embedded project assets | Portable JSON package payload. |
| Audio metadata JSON | Yes | Yes | Metadata only | Does not encode sound. |
| MP4 H.264 | No | FFmpeg required | Optional | Uses `libx264`. |
| MP4 H.265 | No | FFmpeg required | Optional | Uses `libx265`; codec support varies. |
| ProRes MOV | No | FFmpeg required | Optional | Uses `prores_ks`. |
| MP3 | No | FFmpeg required | Audio only | Uses `libmp3lame`. |

## Presets

- Draft Preview 720p
- YouTube 1080p
- YouTube 1440p
- Cinematic 2.35:1 1080p
- Vertical Shorts 1080x1920
- Transparent PNG Sequence
- High Quality PNG Sequence
- Low File Size WebM

## Preflight

Validation checks the selected camera, frame range, runtime format support,
tracked missing assets, audio compatibility, frame count, estimated output
size, post-processing state, and VFX state. Warnings remain visible in the job
panel; blocking errors prevent queue insertion.
