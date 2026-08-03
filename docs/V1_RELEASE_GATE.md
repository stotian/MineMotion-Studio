# MineMotion Studio v1.0 release gate

Target contract: project schema 10, `.minemotion` package schema 1, settings schema 2, template schema 1, extension API 1.0.

The current result is **V1_BLOCKED**, not `V1_COMPLETE`. Source-level workflow, migration, corruption, security, legal, template, documentation, and deterministic QA gates have evidence. Clean locked installation, full type/test/build/audit, native artifacts, installer smoke tests, manual visual QA, measured post-build/native performance, remote CI, version/tag agreement, and authorized publication remain blocked or unrun.

`npm run verify:v1-gate` is intentionally red until every record in `distribution/v1-release-evidence.json` is `pass`. Do not change the status merely to make CI green; attach real evidence first.
