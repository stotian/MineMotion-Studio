# Audio And SFX

Phase 2 adds timeline-ready SFX support without bundling copyrighted audio.

## Supported

- Import `.wav`, `.mp3`, and `.ogg` through the browser file picker.
- Store imported audio as project clip metadata with a data URL.
- Add built-in placeholder SFX descriptors:
  - Lightning Crack
  - Impact Hit
  - Whoosh
  - Deep Boom
  - Camera Rumble
  - Magic Pulse
  - Glitch Pop
- Display audio blocks on the timeline.
- Trigger clips during timeline playback when their start frame is crossed.

## Current Limits

- No full mixer.
- No waveform rendering.
- No trimming UI.
- Placeholder SFX are generated metadata/tone hooks, not bundled sound files.
