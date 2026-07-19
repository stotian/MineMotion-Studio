# VFX Package Authoring Guide

MineMotion Studio VFX packages are portable declarative data, not plugins. The
supported workflow is designed so an effect can be inspected, bounded, rendered,
and shared without executing author-controlled code.

## Authoring workflow

1. Open **VFX Studio** from the main toolbar.
2. Start blank or derive a copy from one of the 60 stable built-ins. Derivation
   never mutates the built-in preset.
3. Add at most 16 primitive, emitter, or restricted modifier stack items.
4. Reorder, duplicate, enable/disable, target, and edit the stack. The preview
   recompiles after each valid change.
5. Set duration, optional entity/bone target, and preview/export quality.
6. Enter the package author and SPDX-style license, then export the deterministic
   `.minemotion-vfx` archive.
7. Re-import with **Inspect Package** before installation. Inspection never
   changes the local registry.

Supported stack outputs are Primitive V1 particle emitters, beams, trails,
expanding rings, and light pulses. Restricted modifiers apply tint, opacity, or
scale to enabled items above them. Arbitrary callbacks, scripts, node execution,
GLSL/WGSL source, and processes are not part of the format.

## Manifest and archive rules

Every archive has exactly one root `manifest.json`, one root `effect.json`, and
only the assets declared by the manifest. IDs are stable identifiers; package
versions and dependency ranges use validated semantic versions. The manifest
records minimum Studio version, author, license, permissions, dependencies, and
asset metadata.

The reader accepts the bounded ZIP32 profile only. It rejects traversal,
absolute/backslash/non-normalized paths, case-fold duplicates, undeclared files,
symlinks, encryption, ZIP64/multi-disk records, unsupported compression/flags,
CRC or local/central metadata disagreement, overlapping records, unsafe
extensions, and decompression bombs.

Current hard limits include 32 MiB archive bytes, 256 entries, 16 MiB per entry,
64 MiB total uncompressed bytes, 512-byte paths, 100:1 compression ratio, 128
assets, 32 dependencies, and 4,096-pixel image dimensions. Compiled effects also
remain inside the existing per-primitive and global frame budgets.

## Assets and permissions

The following declared asset kinds are recognized:

- PNG texture, sprite, and thumbnail data with signature/dimension validation;
- WAV, OGG, or MP3 audio with matching signatures;
- bounded `minemotion-box-model` JSON;
- ordered gradients and curves;
- bounded localization dictionaries;
- restricted built-in shader-template IDs with exact parameter schemas.

Texture/audio/model/template permissions must be declared where required. Asset
licenses may override the package license and are shown before installation.
Restricted shader assets never contain source. A valid but unavailable template
falls back visibly to the Primitive V1 default material.

## Dependencies and lifecycle

Installation stores the canonical validated archive locally. Required
dependencies must already be enabled at a compatible version. The registry
prevents disabling, uninstalling, or incompatibly updating a package that an
enabled dependent requires. Updates must increase semantic version.

Only enabled packages appear as custom Effects Library cards. Adding one inserts
an ordinary timeline effect into the existing project collection and embeds the
compiled descriptors plus package/document provenance in schema 10. The project
therefore keeps rendering after the source package is disabled, uninstalled, or
updated; the scene effect list shows that source state. Existing project recipes
are intentionally not rebased automatically.

Schema 9 cannot represent embedded custom recipes. A schema 9 export fails with
an explicit error instead of dropping the effect. Schemas 1–9 otherwise retain
their tested migration path to schema 10.

## Safe failure and troubleshooting

- **Inspection fails:** treat the archive as untrusted; correct the reported
  manifest, path, asset, version, or budget error at the source.
- **Install not ready:** enable/install the exact required dependency versions.
- **Local storage unavailable/full:** no registry mutation is kept. The stored
  payload is not silently deleted.
- **Source missing/disabled/version changed:** the embedded project effect stays
  valid and the source warning remains visible.
- **Target missing:** frame preparation emits a warning and resolves no target;
  the project stays open.
- **Schema 9 requested:** keep schema 10 or remove custom/native-only effects.

The deterministic examples in `examples/vfx` are production-writer fixtures and
a practical starting point. `npm run generate:vfx-examples` proves byte identity,
reader validity, and checked-in SHA-256 synchronization; the read-only
`npm run verify:vfx-examples` command fails on any archive or checksum drift.
