# Phase 20.14 — Optimization recommendations

Viewport diagnostics now evaluate the existing immutable Draft performance
budget and display at most three prioritized recommendations.

The report is deliberately advisory:

- it returns data only;
- it has no project patch or quality-change callback;
- hard-limit issues are shown before recommendation-level issues;
- unavailable measurements remain unavailable rather than guessed;
- English and French messages are stable catalog entries.

Recommendations cover startup load, frame time, heap, render calls, visible
geometry, loaded geometries/textures, scene groups, world radius, and active
VFX. The existing user-selected quality/profile remains authoritative.
