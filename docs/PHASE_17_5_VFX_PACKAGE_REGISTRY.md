# Phase 17.5 - Local VFX Package Registry

The versioned local registry stores each already validated package as immutable
canonical archive Base64 and reparses it through the bounded reader on load.
Limits are 32 packages, 1 MB per locally installed archive, 2 MB total package
bytes, and 3 MB serialized storage text. Larger portable packages remain safe to
inspect/export but are honestly rejected by the browser local registry.

Lifecycle operations support explicit install, compatible increasing-SemVer
update, enable, disable, inspect, and uninstall. Required dependencies must be
enabled and version-compatible. Disable, uninstall, or update cannot break an
enabled dependent. Corrupt, oversized, mismatched, or dependency-inconsistent
stored registries fail soft to an empty runtime registry without deleting the
recoverable stored value.

Package IDs cannot collide with immutable built-in preset, definition, or effect
IDs. VFX Studio exposes all lifecycle actions; uninstall requires confirmation.
Inspection remains available for installed entries and no registry mutation is
kept when local storage fails or is full.
