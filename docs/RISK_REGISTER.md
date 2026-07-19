# MineMotion Studio Risk Register

This register tracks active continuation risks. Repository code and committed
phase documents remain the source of truth for implementation details.

| ID | Risk | Status | Target | Current mitigation |
| --- | --- | --- | --- | --- |
| RISK-A | Legacy visible effects and typed VFX runtime coexist | CONFIRMED | 15.7 | Preserve the compatibility adapter; do not add a parallel store or remove legacy rendering before parity. |
| RISK-B | Viewport and export VFX paths differ; `includeVfx=false` is incomplete | CONFIRMED | 15.7 | Build one typed evaluation/render-preparation path and prove input parity. |
| RISK-C | Scene renderer rebuilds can leak GPU resources | CONFIRMED | 15.8 | Add focused disposal, repeat-cycle tests, and measured resource diagnostics. |
| RISK-D | `App.tsx` remains an orchestration hotspot | CONFIRMED | Incremental | 15.4 adds a focused effect command controller; new VFX rules stay outside `App.tsx`. |
| RISK-E | `EffectTimelineController.ts` is large | CONFIRMED | After 15.8 | Preserve behavior now; split only with characterization tests in a maintenance change. |
| RISK-F | Main bundle is about 1 MB | CONFIRMED | 15.8/20 | Measure imports before lazy-loading or chunk changes. |
| RISK-G | Manual browser smoke cannot attach to local webview | ENVIRONMENT_BLOCKED | Per UI milestone | Retry once per major UI milestone, document the result, and retain automated regression coverage. |
| RISK-H | GitHub CI status is not yet evidenced | NOT_YET_AUDITED | After 15.9 | Add a Node CI workflow when it no longer distracts from Phase 15 stabilization. |
| RISK-I | JSON package/save safety and future schema migration need audit | CONFIRMED | 15.6/24 | Keep schema 9 round-trips intact; make schema 10 migration explicit and tested. |

## Phase 15.5 Resolution

- Schema/UI drift is removed by one schema-to-control model for all five current
  parameter kinds.
- Unknown finite legacy parameters and special own keys survive known edits and
  all tested persistence paths.
- Non-hex legacy colors remain editable as text and are never silently coerced;
  unsafe CSS resource/function values are rejected.
- Visual consumption gaps and schema 9 keyframe/native-field limits remain
  tracked as LIM-012 and LIM-027 for milestones 15.6-15.7.
