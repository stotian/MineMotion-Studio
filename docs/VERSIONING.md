# Versioning Policy

MineMotion Studio uses semantic application versions and independent integer
project/package schema versions.

- Application versions change only at an explicit release checkpoint, not at
  every internal phase commit.
- Pre-1.0 minor releases may contain substantial compatible features; patch
  releases are reserved for fixes that do not intentionally expand formats.
- Project schema increments only for persisted project-contract changes and
  must include migration plus backward-compatibility evidence.
- VFX manifest/package versions follow strict SemVer, including prerelease
  precedence. Minimum Studio versions are compared by the same implementation.

The current development checkpoint remains application `0.8.2` because no new
release has been cut. Schema 10 and Phase 19 changes are listed under
`Unreleased`. A release bump must synchronize `package.json`, `package-lock.json`,
Tauri config, Cargo package metadata/lockfile, project metadata defaults,
MineMotion package minimum version, generated VFX examples, README, changelog,
and compatibility tests in one validated commit.
