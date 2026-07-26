# MineMotion Studio Risk Register

This register tracks active continuation risks. Repository code and committed
phase documents remain the source of truth for implementation details.

| ID | Risk | Status | Target | Current mitigation |
| --- | --- | --- | --- | --- |
| RISK-A | Compatibility visuals remain over the canonical typed VFX runtime | MITIGATED | 16 | Keep the adapter until primitive visual parity is proven; no parallel store/lane exists. |
| RISK-B | Viewport and export VFX paths previously differed | RESOLVED | 15.7 | One prepared-frame contract and composited capture path now feed all visual outputs. |
| RISK-C | Scene renderer rebuilds can leak GPU resources | CONFIRMED | 15.8 | Add focused disposal, repeat-cycle tests, and measured resource diagnostics. |
| RISK-D | `App.tsx` remains an orchestration hotspot | CONFIRMED | Incremental | 15.4 adds a focused effect command controller; new VFX rules stay outside `App.tsx`. |
| RISK-E | `EffectTimelineController.ts` is large | CONFIRMED | After 15.8 | Preserve behavior now; split only with characterization tests in a maintenance change. |
| RISK-F | Main bundle is about 1 MB | CONFIRMED | 15.8/20 | Measure imports before lazy-loading or chunk changes. |
| RISK-G | Manual browser smoke cannot attach to local webview | ENVIRONMENT_BLOCKED | Per UI milestone | Retry once per major UI milestone, document the result, and retain automated regression coverage. |
| RISK-H | GitHub CI status is not yet evidenced | NOT_YET_AUDITED | After 15.9 | Add a Node CI workflow when it no longer distracts from Phase 15 stabilization. |
| RISK-I | Downloaded JSON package writes are not atomic filesystem saves | PARTIALLY_MITIGATED | 24 | Schema 10 migration/package validation is tested and browser autosave keeps a rollback copy; native atomic file save still needs desktop work. |
| RISK-APP-001 | `App.tsx` continues accumulating domain orchestration | MITIGATED / CONFIRMED | 19-20 | Phase 19.3 extracted rig/pose/IK orchestration, reduced 2,839 to 2,677 lines, and added a reviewed source-size ceiling. |
| RISK-IK-001 | Euler-angle multiplication produced incorrect IK influence near discontinuities | RESOLVED | 19.3 | Shortest-path identity-to-solution quaternion slerp with 0/0.25/0.5/1 and ±180° regressions. |
| RISK-IK-002 | Analytic positions did not reflect limited/influenced returned rotations | RESOLVED | 19.3 | Ideal and forward-kinematic evaluated positions are distinct typed fields and tested against final rotations. |
| RISK-DOC-001 | README schema, milestone, IK, and validation claims drifted from source | RESOLVED | 19.3 | Schema 10, Phase 19.3, version policy, limits, and handoff documents synchronized. |
| RISK-CI-001 | GitHub had no repository validation workflow | MITIGATED | 19.3 | Node 20 CI now runs locked install, types, tests, locales, examples, architecture check, build, and high-severity audit. Remote run remains evidence-driven. |
| RISK-SMOKE-001 | Integrated browser cannot complete local visual smoke | ENVIRONMENT_BLOCKED | Per UI milestone | One 2026-07-20 attempt timed out and reset browser control; the reproducible human checklist remains unpassed. |
| RISK-SEMVER-001 | VFX minimum-version checks could ignore prerelease precedence | RESOLVED | 19.3 | One strict SemVer parser/comparator now feeds manifest, dependency, inspection, and archive checks. |
| RISK-VFXZIP-001 | The security-sensitive custom ZIP reader needs broader malformed/fuzz corpus evidence | CONFIRMED | Future hardening | Add deterministic bounded corpus/property tests for header mismatches, Unicode collisions, ranges, descriptors, ratios, CRC, and multiple ZIP writers. |

## App extraction backlog

- `APP-EXTRACT-01` Rig/IK orchestration — completed for touched Phase 19.3 paths.
- `APP-EXTRACT-02` Timeline/playback orchestration — Phase 19/20.
- `APP-EXTRACT-03` VFX editor orchestration — Phase 20 when touched.
- `APP-EXTRACT-04` Project lifecycle/autosave — Phase 20/24 when touched.
- `APP-EXTRACT-05` Render/export orchestration — Phase 20/22 when touched.
- `APP-EXTRACT-06` Selection and panel coordination — incremental when touched.

## Phase 15.5 Resolution

- Schema/UI drift is removed by one schema-to-control model for all five current
  parameter kinds.
- Unknown finite legacy parameters and special own keys survive known edits and
  all tested persistence paths.
- Non-hex legacy colors remain editable as text and are never silently coerced;
  unsafe CSS resource/function values are rejected.
- Visual consumption gaps and unconnected native keyframe evaluation remain
  tracked as LIM-012 and LIM-027 for milestone 15.7.

## Phase 15.6 Resolution

- Schemas 1-9, project JSON, autosave, package, history, and render-package
  persistence paths are inventoried and covered by migration round trips.
- Schema 10 corruption, future versions, and legacy/native disagreement fail
  closed. Failed autosave recovery retains both primary and backup payloads.
- Native VFX persistence is no longer a risk; runtime coexistence and visual
  parity remain RISK-A/RISK-B for 15.7.

## Phase 15.7 Resolution

- Native prepared frames are the common timing/parameter/quality/target input
  for world, camera, overlay, PNG, WebM, and FFmpeg consumers.
- Final-camera presentation applies export VFX visibility before capture;
  disabled VFX short-circuits without evaluating or drawing any VFX layer.
- WebM records the canonical composited capture rather than the raw viewport.
- Compatibility visuals remain intentionally tracked by mitigated RISK-A;
  resource churn and global budgets remain RISK-C for 15.8.
