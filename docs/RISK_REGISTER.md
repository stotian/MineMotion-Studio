# MineMotion Studio Risk Register

This register tracks active continuation risks. Repository code and committed
phase documents remain the source of truth for implementation details.

| ID | Risk | Status | Target | Current mitigation |
| --- | --- | --- | --- | --- |
| RISK-A | Compatibility visuals remain over the canonical typed VFX runtime | MITIGATED | 16 | Keep the adapter until primitive visual parity is proven; no parallel store/lane exists. |
| RISK-B | Viewport and export VFX paths previously differed | RESOLVED | 15.7 | One prepared-frame contract and composited capture path now feed all visual outputs. |
| RISK-C | Scene renderer rebuilds can leak GPU resources | CONFIRMED | 15.8 | Add focused disposal, repeat-cycle tests, and measured resource diagnostics. |
| RISK-D | `App.tsx` remains an orchestration hotspot | MITIGATED / CONFIRMED | Incremental | Project, export, world-import, rig, and constraint controllers reduce it to 1,887 lines; timeline/VFX/panel coordination remains. |
| RISK-E | `EffectTimelineController.ts` is large | CONFIRMED | After 15.8 | Preserve behavior now; split only with characterization tests in a maintenance change. |
| RISK-F | Main bundle is about 1 MB | CONFIRMED | 15.8/20 | Measure imports before lazy-loading or chunk changes. |
| RISK-G | Manual browser smoke cannot attach to local webview | ENVIRONMENT_BLOCKED | Per UI milestone | Retry once per major UI milestone, document the result, and retain automated regression coverage. |
| RISK-H | GitHub CI status is not yet evidenced | NOT_YET_AUDITED | After 15.9 | Add a Node CI workflow when it no longer distracts from Phase 15 stabilization. |
| RISK-I | Downloaded JSON package writes are not atomic filesystem saves | PARTIALLY_MITIGATED | 24 | Schema 10 migration/package validation is tested and browser autosave keeps a rollback copy; native atomic file save still needs desktop work. |
| RISK-APP-001 | `App.tsx` continues accumulating domain orchestration | MITIGATED / CONFIRMED | 19-20 | Focused rig, constraint, world-import, export, and project workspace controllers reduce 2,839 to 1,887 lines; the ceiling is tightened to 1,900. |
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
- `APP-EXTRACT-04` Project lifecycle/autosave — completed in Phase 20.12.
- `APP-EXTRACT-05` Render/export orchestration — completed at recovered baseline `9e42943`.
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

## Phase 20 completion update

- `RISK-D` / `RISK-APP-001`: further mitigated. Project workspace authority is
  extracted and Timeline/NLA presentation is split; `App.tsx` is 1,887/1,900 and
  `TimelinePanel.tsx` is 987/1,000.
- Bundle drift is now bounded by post-build main/total/worker byte ceilings.
- WebGPU capability drift is bounded by a pure policy that never selects the
  experimental backend.
- `RISK-CI-RECOVERY-001` remains open: dependency installation and GitHub writes
  are environment-blocked, so local Phase 20 completion is not remote acceptance.

## Phases 26–35 release update

| ID | Risk | Status | Mitigation |
|---|---|---|---|
| RISK-REL-001 | Locked dependency install cannot complete in the recovery registry | ENVIRONMENT_BLOCKED | Preserve the lockfile, record the exact E404, retain no partial `node_modules`, and require a clean registry gate. |
| RISK-REL-002 | Native support could be overclaimed without tested installers | FAIL_CLOSED | All four platform targets keep `supportClaimed: false`; v1 evidence and docs reject stable claims. |
| RISK-REL-003 | A tag/version could be created before product evidence is green | FAIL_CLOSED | App remains 0.8.2, no v1 tag exists, and the guarded workflow runs `verify:v1-gate`. |
| RISK-REL-004 | Local completion could diverge from GitHub | CONFIRMED | Deliver source ZIP, Git bundle, patch, context and checksums; remote CI remains a blocker. |
| RISK-REL-005 | Source-level performance contracts could be confused with measured native performance | OPEN_MEASUREMENT | Keep bundle/native/GPU gates blocked until a production build and named target machines produce evidence. |
