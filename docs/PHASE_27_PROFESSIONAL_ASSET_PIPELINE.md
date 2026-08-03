# Phase 27 — Professional asset pipeline

Status: **LOCAL_COMPLETE**

## Delivered

- Versioned asset records with stable identity, type, source descriptor, package
  path, storage policy, references, integrity state, hash, favorites, recent use,
  tags, thumbnails and bounded metadata.
- Backward-compatible migration of the former `records + warnings` library.
- Project collection for OBJ, Minecraft skins, Blockbench models, audio,
  resource packs, world references/caches, rig poses and animation clips.
- Grid/list library UI with search, favorite and missing filters, asynchronous
  bounded thumbnails, package size, dependency and duplicate summaries.
- Bounded drag/drop inspection with per-file and total byte limits, file count
  limits, extension classification and PNG dimension validation.
- SHA-256 hashing when Web Crypto is available, deterministic fallback hashing,
  duplicate grouping, missing/corrupt detection and relink ranking.
- Removal preview that protects referenced, favorite and healthy external
  assets. Confirmed cleanup updates the project-owned collections and leaves a
  bounded recovery audit entry.
- Dependency inspection for embedded, referenced, cached and generated assets.

## Safety and portability boundaries

- A referenced world remains read-only and is explicitly reported as external.
- Unsupported files are reported, never interpreted as executable content.
- GLTF/GLB is classified for capability reporting but no renderer support is
  claimed until a production importer exists.
- Archive entry limits are shared with import reports; resource-pack parsing
  remains responsible for its own path and decompression checks.
- Thumbnail generation is asynchronous and concurrency-bounded. It never owns
  project data and may fail without making the asset unusable.

## Validation

- Strict targeted TypeScript check of the complete pure asset pipeline.
- Runtime migration, favorites/recent, query, duplicate, import-bound and PNG
  dimension checks.
- Static project audit: syntax, relative imports, locale parity and architecture
  ceilings.
- Acceptance coverage in `AssetLibraryPhase27.test.ts` for legacy migration,
  references, cleanup, relink, import bounds and dependency reporting.

The dependency-backed Vitest/build gate remains blocked by the unavailable
locked package registry; this phase is therefore local-complete, not remotely
accepted.
