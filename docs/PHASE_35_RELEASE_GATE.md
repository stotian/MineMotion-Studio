# Phase 35 — v1.0 release gate

## Result

The Phase 35 audit is complete, but the release result is **`V1_BLOCKED`**. MineMotion Studio must not be tagged, version-bumped, or published as v1.0 until every required product-level gate has real evidence.

## Completed release engineering

- Audited every item in `completion-pack/99_DEFINITION_OF_DONE.md`.
- Froze the target public contracts: project schema 10, package schema 1, settings schema 2, template schema 1, extension API 1.0.
- Added a fail-closed release evaluator and machine-readable evidence registry.
- Re-ran migrations, portable package round trips, corruption rejection, templates, samples, deterministic systems, security defaults, legal scans, documentation links, cross-platform contracts, beta truth checks, architecture ceilings, syntax, imports, and localization parity.
- Generated third-party notices, draft release notes, a guarded release workflow, and a post-release maintenance backlog.
- Kept application/package/Tauri versions at `0.8.2`; no `v1.0.0` tag or release artifact was created.

## Local audit evidence

- 659 TypeScript/TSX files inspected; no syntax or missing-relative-import error.
- 1,387 English and 1,387 French localization keys; no coverage difference.
- `App.tsx`: 1,887/1,900 lines.
- `TimelinePanel.tsx`: 987/1,000 lines.
- Template, documentation, clean-onboarding documentation, cross-platform, release-input, beta-contract, and security/legal source gates pass.
- Release-gate runtime correctly returns `V1_BLOCKED` with 8/16 evidence gates passing.
- Comparison with the recovered GitHub snapshot: all 710 baseline files still exist locally; 579 are byte-identical, 131 were intentionally changed, 225 files were added, and none were removed.

## Blocking evidence

1. `npm ci` returns `E404` for `@tauri-apps/plugin-fs@2.5.1` from the configured registry. Full typecheck, Vitest, Vite build, audit, and dependency-backed generation therefore cannot run.
2. `rustc` and `cargo` are unavailable, so native builds and installers cannot be produced or smoke-tested.
3. No completed manual visual QA session exists for browser/native primary workflows.
4. Post-build bundle and native GPU budgets cannot be measured without the real build/artifacts.
5. GitHub `main` remains on the older baseline; local completion commits and CI workflows are not remote.
6. No authorized signing, tagging, upload, or publication credentials are present.

## Release rule

`npm run verify:v1-gate` is intentionally red while any evidence record is not `pass`. Never edit the evidence merely to make CI green. Attach the clean install, full automated suite, native artifacts, installer smoke results, manual visual QA, measured performance, remote CI, signatures, checksums, tag, and authorization first.
