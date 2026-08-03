# Codebase map

- `src/App.tsx` — composition root; architecture ceiling enforced.
- `src/project` — project model, schema migration, package persistence,
  autosave and workspace authority.
- `src/renderer` / `src/rendering` — scene ownership, layers, final-camera and
  offline render paths.
- `src/animation`, `src/rigs` — tracks, timeline commands, rigs and constraints.
- `src/minecraft` — bounded read-only world/resource import and portable cache.
- `src/vfx` — deterministic effects, packages and runtime sampling.
- `src/production` — shots, takes, validation and handoff.
- `src/ultra` — versioned Phase 36–600 production domains/capability contracts, bounded hybrid serialization, domain validation and executable acceptance gates.
- `src/plugins` and `packages/minemotion-plugin-sdk` — secure extension boundary.
- `src/recovery`, `src/reliability`, `src/diagnostics` — recovery and support.
- `src/desktop`, `src-tauri` — native dialogs, restricted filesystem and FFmpeg.
- `src/experimental` — feature-flagged prototypes only.
- `docs` — architecture, user, release and phase evidence.
