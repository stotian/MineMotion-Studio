# Phase 16.10 - Generated Previews And Stable Verification

All 60 native presets now have a deterministic SVG preview generated from their
validated primitive descriptors. The Effects Library schedules one preview per
idle task, reuses versioned local cache entries, remains usable when storage or
generation fails, and progressively replaces pending placeholders.

Native metadata is now `stable` with a ready generated-thumbnail contract.
The 12 earlier compatibility entries remain compatibility/experimental and are
excluded from the stable count. Stable eligibility still requires native
runtime, editable preview/export capability, current schema support, registered
recipe, bounded work, localization, and a ready preview.

Automated evidence covers all 60 stable presets: all four quality levels,
timeline insertion, schema 10 JSON and `.minemotion` package round-trips,
prepared preview/export frames, deterministic thumbnails, missing-target
warnings, corrupt/missing preview cache recovery, and bounded cache records.
