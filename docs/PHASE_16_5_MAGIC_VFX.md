# Phase 16.5 - Magic And Energy VFX

Eight native presets extend the shared recipe registry: magic aura, dual-layer
beam, projectile trail/core, concentric portal, teleport collapse, heal,
corruption, and power-up. They compose existing deterministic particles,
beams, trails, rings, and light pulses with pre-allocation aggregate budgets.

Every exposed parameter affects native preview/export output. The portal's
final-quality budget is 44 particles and 160 segments. All presets reuse schema
10 effects, timeline, Inspector, serializers/packages, prepared frames, and the
shared Three.js/export canvas. They remain experimental pending thumbnails and
the stable-preset regression gate.
