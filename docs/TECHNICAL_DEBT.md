# Technical Debt

Debt is reduced at the domain boundary being changed; this is not a mandate for
a high-risk rewrite.

## Composition root

`RISK-APP-001` is confirmed. `App.tsx` measured 2,839 lines at the beginning of
Phase 19.3. Rig, pose, animation-preset, and IK command orchestration moved to
`src/rigs/RigWorkspaceController.ts`; the resulting file is 2,677 lines.

The reviewed ceiling remains 2,839 and is checked by
`npm run verify:architecture`. Raising it requires an explicit architecture
review. The check must never be satisfied through minification or unreadable
formatting.

Extraction backlog: `APP-EXTRACT-01` rig/IK (done for touched paths),
`APP-EXTRACT-02` timeline/playback, `APP-EXTRACT-03` VFX editor,
`APP-EXTRACT-04` lifecycle/autosave, `APP-EXTRACT-05` render/export, and
`APP-EXTRACT-06` selection/panel coordination.

## Phase 20 performance debt

- Main JavaScript bundle remains large; Phase 19.3 build output must be recorded.
- `Animator.sampleProject` broadly clones project data.
- Static scene and OBJ resources are reconstructed too often.
- Worker extraction, chunk splitting, and long-session profiling remain open.

## Security hardening

The VFX ZIP parser remains closed, bounded, non-executing, and covered by its
current adversarial tests. `RISK-VFXZIP-001` tracks a future deterministic
malformed/property corpus without casually replacing the parser.
