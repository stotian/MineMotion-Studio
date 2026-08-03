# Security policy

Report vulnerabilities privately to the repository owner rather than opening a
public exploit issue. Do not include real project files, tokens, API keys,
private paths, or personal data in reports.

Supported security boundaries include bounded project/ZIP parsing, read-only
Minecraft source import, explicit extension trust/capabilities, worker messaging,
restricted Tauri permissions, allowlisted FFmpeg arguments, and local redacted
support bundles. These controls reduce risk but do not replace review and the
full release gate.

No automatic telemetry upload is enabled. Never publish unsigned or untested
artifacts as an official stable release.
