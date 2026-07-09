# Audio Export

Phase 3 adds browser WAV mixdown.

## Supported Sources

- Imported `.wav`, `.mp3`, and `.ogg` files embedded as data URLs.
- Built-in placeholder SFX rendered as sine oscillators with the placeholder
  tone frequency.

## Pipeline

WAV export uses `OfflineAudioContext`:

1. creates an offline context for the project duration
2. schedules imported clips and placeholder oscillators at their timeline frames
3. renders the mixdown
4. encodes 16-bit PCM WAV

If `OfflineAudioContext` is not available, the Export panel reports that WAV
mixdown is unsupported in the current browser.
