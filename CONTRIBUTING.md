# Contributing

1. Create a focused branch from the current default branch.
2. Keep project state, history, renderer ownership, and persistence authority in
   their existing controllers; do not introduce duplicate stores.
3. Add migration coverage for every persisted schema change.
4. Keep external content data-only unless it uses the reviewed worker/capability
   boundary. Never expose unrestricted filesystem, processes, environment data,
   secrets, or native evaluation.
5. Run the locked install, typecheck, tests, locale guard, architecture guard,
   build, performance checks, and high-severity audit before opening a PR.
6. Update README, changelog, relevant guides, current state, and phase progress
   for meaningful behavior changes.

See `AGENTS.md`, `docs/DEVELOPER_GUIDE.md`, and `docs/QA_MATRIX.md`.
