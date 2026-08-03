# Phase 23 — Secure plugin SDK and content packs

The extension boundary has two categories:

- **Content packs** are bounded JSON data. They cannot declare code. Safe camera presets and serialized project templates are registered by host-owned code.
- **Logic plugins** are executable workers. They are disabled and untrusted by default, require explicit capabilities and trust, and communicate only through bounded messages.

The SDK API is versioned `1.0` and declares commands, templates, presets, VFX, rigs, generators, importers, exporters, localization, validators and settings-page permissions. Manifests include semantic versions, compatibility, dependencies, capabilities and license metadata. Validation rejects traversal paths, duplicate IDs, oversized data and unsupported API versions. Filesystem, processes, environment variables, secrets, native evaluation and unrestricted networking are prohibited.

Safe mode disables external extensions. The local manager supports inspect, install/update, trust, enable/disable and uninstall operations with bounded logs and failure isolation. Four developer examples cover camera data, VFX data, importer-worker logic and command-worker logic. Stable MineMotion does not claim that arbitrary third-party code is safe or supported outside the worker capability boundary.
