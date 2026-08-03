# Data flow

1. `useProjectWorkspaceController` owns the current `MineMotionProject`, history, persistence, recovery, and replacement boundaries.
2. Domain controllers receive the project and return immutable replacements.
3. The timeline samples deterministic frame state; the renderer consumes the sampled project without becoming a second authority.
4. Importers decode bounded external data into typed project records. Minecraft sources remain read-only.
5. The package layer serializes the project and separately indexed assets into `.minemotion` ZIP entries.
6. Preview and export share camera, post-processing, simulation, audio, and render-pass plans.
7. Diagnostics are local and redact paths, assets, and secrets before support export.
