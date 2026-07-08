# Plugin System

Phase 1.5 adds the first plugin-ready architecture. It is intentionally
conservative: built-in plugins are registered, manifests are validated, and the
UI can manage plugin enabled state, but external plugin JavaScript is not
executed yet.

## Current Pieces

- `PluginManifest`: plugin identity, version, permissions, and entry metadata.
- `PluginPermissions`: known permission names.
- `PluginRegistry`: stores plugin registrations and enabled state.
- `PluginLoader`: registers built-in plugins and blocks external execution for
  now.
- `PluginAPI`: shape of the future API exposed to trusted plugins.
- `PluginManagerPanel`: UI for viewing and toggling plugins.

## Built-In Plugins

- `minemotion.builtin.templates`
- `minemotion.builtin.presets`
- `minemotion.builtin.obj-importer`

## Permissions

Current permission names:

- `registerTemplates`
- `registerPresets`
- `registerImporters`
- `readProject`
- `writeProject`
- `readSettings`
- `writeSettings`

## Security Boundary

External scripts are disabled in Phase 1.5. This avoids pretending there is a
real sandbox before one exists. Future work should define:

- package format
- signature or trust model
- sandboxed execution environment
- capability-based API access
- plugin install and update flow
- crash isolation and diagnostics
