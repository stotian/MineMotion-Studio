# VFX guide

Use VFX Studio to choose a built-in recipe or a validated installed content
pack, place it in the scene, and edit its deterministic parameters. Effects are
sampled from project time and share preview/export preparation. Use anchors for
world-relative placement and the VFX render pass for compositing.

Treat external VFX packages as untrusted until their manifest, assets,
compatibility, and permissions have been reviewed. Safe content packs contain
data only; executable logic belongs behind the worker capability boundary.
