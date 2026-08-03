# Phase 24 — Reliability and desktop hardening

## Storage and recovery

`.minemotion` is a versioned stored ZIP with `package-index.json`, `manifest.json`, `project.json`, metadata and asset entries. Extraction accepts only stored entries, rejects encryption, descriptors, traversal, duplicate names and CRC failures, and enforces archive, entry, entry-count and extracted-size limits. Historical JSON packages and legacy projects continue to migrate through the existing serializers.

Autosave keeps primary and backup copies plus a bounded five-snapshot recovery history. Startup recovery is an accessible dialog; corrupt recovery data is isolated and can be cleared without deleting unrelated settings. Saving rolls back the primary autosave when possible if a write fails.

## Diagnostics and accessibility

Support bundles are opt-in, generated locally, and contain only redacted logs, capability data, sanitized settings and an optional structural project summary. They exclude the full project, source paths, assets and secrets. Settings include text/UI scale, reduced motion, high contrast and color-vision modes. Status changes use an ARIA live region and keyboard focus has a visible outline.

## Desktop

Tauri uses restricted dialog/filesystem capabilities for native open/save, records native recent files, and associates `.minemotion` and `.minemotion-vfx`. FFmpeg runs in a tracked child-process registry and can be killed by job ID. Development, beta and stable channels are defined separately; unsigned local artifacts must not be presented as official releases.

## Known validation blocker

The local runner used for this recovery cannot resolve all packages from its configured npm registry, and Rust tooling is absent. Frontend syntax/contracts were checked locally; full npm, Cargo, installer and signing gates remain CI/release gates and must not be overclaimed.
