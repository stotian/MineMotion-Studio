# Phase 16.9 - VFX Library Navigation

The Effects Library now supports deterministic text search, category filtering,
cumulative tag filters, favorites-only browsing, recent presets, and explicit
All/Built-in/Custom source views. Search covers localized name, description,
category, space, maturity, runtime, and tags while preserving catalog order.

Favorites and recents are bounded local UI preferences, not project data:
128 favorites and 20 recents maximum under a versioned storage key. Parsing
deduplicates IDs, rejects malformed state, tolerates unavailable storage, and
drops missing recent IDs when resolving against the authoritative catalog.

All 72 current entries are labeled Built-in. The Custom view honestly reports
zero installed packages; Phase 17 will own authoring/import rather than Phase 16
inventing a parallel preset architecture.
