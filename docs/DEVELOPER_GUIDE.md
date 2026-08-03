# Developer guide

Core rules:

- one canonical project state and one history owner;
- deterministic frame sampling for preview and export;
- bounded parsing, allocation, queues, logs and caches;
- explicit renderer/layer/resource ownership and disposal;
- schema migrations for persisted changes;
- data-only content packs and capability-gated worker logic;
- honest fallbacks: never advertise an unavailable pass/backend/codec;
- documentation and tests updated with every major change;
- Ultra phase data must use `src/ultra`, remain bounded and pass `npm run verify:ultra`.

Run `npm run verify:ultra-roadmap` and `npm run verify:ultra` after any Phase 36–600 roadmap, model, serializer, validator or default-artifact change.
Useful commands are listed in `package.json`. Architecture maps live in
`ARCHITECTURE.md`, `CODEBASE_MAP.md`, and phase-specific documents.
