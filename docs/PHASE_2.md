# Phase 2

Phase 2 adds the first cinematic production layer on top of the Phase 1.5
editor foundation.

## Delivered

- Project schema v3.
- Migration from schema v1/v2 to schema v3.
- Cinematic effects registry and serializable effect instances.
- Effects Library panel.
- Three.js world effects:
  - Lightning Strike
  - Shockwave
  - Glow Burst
- Screen effects:
  - Impact Frame
  - Flash
  - Explosion Flash
  - Speed Lines
  - Fog Pulse
  - Vignette Pulse
  - Cinematic Bars
  - Camera Shake
- Post-processing preset system and CSS/WebGL-safe overlay pipeline.
- Render Preview mode.
- Timeline effect/audio blocks.
- Basic audio import and placeholder SFX metadata.
- Plugin extension points for effects, post presets, SFX, render presets, and
  timeline item types.
- Expanded tests.

## Partial

- The post-processing pipeline is an MVP preview pipeline, not a final
  `EffectComposer` export stack.
- Built-in SFX entries are placeholder descriptors. Imported audio can be stored
  and triggered, but there is no full audio mixer yet.
- Render Preview previews the active camera/post/effects workflow. Full image
  sequence or video export remains future work.

## Validation Targets

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm audit`
