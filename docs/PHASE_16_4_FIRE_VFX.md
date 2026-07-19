# Phase 16.4 - Fire, Smoke, And Explosion VFX

Eight native presets extend the shared built-in recipe registry: fire, smoke
plume, explosion, ember burst, debris burst, dust cloud, Nether fire, and soul
fire. They compose deterministic particle emitters, rings, and light pulses;
all exposed parameters are live and all work is preflighted by the Phase 16.2
recipe contract before global allocation.

The layered explosion requests 64 particles and 112 segments at final quality.
All entries reuse schema 10 effects, timeline, Inspector, prepared-frame,
Three.js preview, and export capture paths. They remain experimental until the
thumbnail and stable-preset regression milestones.
