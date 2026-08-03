# Cross-platform distribution

The release-candidate workflow performs locked installation, frontend gates, Cargo tests, Tauri bundling, and artifact upload independently on Windows, macOS ARM64, macOS Intel, and Linux. A second job creates SHA-256 sums and a machine-readable manifest.

Paths stored inside projects and packages use portable forward-slash relative names. Native dialogs own host paths. Reserved Windows names and path traversal are rejected. FFmpeg is optional and detected per host; WebM/MP4 availability is capability-driven.

The automatic updater is disabled. Enabling it requires signed manifests, protected key rotation, rollback testing, explicit channels, and a security review.
