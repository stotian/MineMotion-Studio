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
