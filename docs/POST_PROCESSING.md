# Post Processing

Phase 2 uses a CSS/WebGL-safe preview pipeline. It is designed to be reliable in
the current Vite/React app without adding heavy rendering dependencies.

## Presets

- Clean Preview
- Cinematic Warm
- Dark Horror
- Nether Heat
- End Void
- Anime Impact
- Dream Glow
- Stormy Contrast
- Retro Pixel
- Noir

## Parameters

- bloom intensity
- vignette amount
- saturation
- contrast
- brightness
- hue shift
- grain amount
- chromatic aberration amount
- pixelation amount
- exposure
- fog color
- fog intensity

## Current Limits

This is not yet a final `EffectComposer` export stack. Future export work should
move these settings into real shader passes for still/image-sequence/video
rendering.
