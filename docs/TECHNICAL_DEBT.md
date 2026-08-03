# Technical Debt

Debt is reduced at the domain boundary being changed; this is not a mandate for
a high-risk rewrite.

## Composition root

`RISK-APP-001` remains confirmed but reduced. `App.tsx` measured 2,839 lines at
the beginning of Phase 19.3. Rig/constraint, world-import, export, and project
document orchestration now live behind focused controllers; the resulting file
is 1,887 lines.

The reviewed ceiling is now 1,900 and is checked by
`npm run verify:architecture`. Raising it requires an explicit architecture
review. The check must never be satisfied through minification or unreadable
formatting.

Extraction backlog: `APP-EXTRACT-01` rig/IK (done for touched paths),
`APP-EXTRACT-02` timeline/playback, `APP-EXTRACT-03` VFX editor,
`APP-EXTRACT-04` lifecycle/autosave (done), `APP-EXTRACT-05` render/export (done), and
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

## Phase 20 completion debt

`TimelinePanel.tsx` is now 987 lines, close to its reviewed 1,000-line ceiling.
New command families must extract a characterized cohesive boundary rather than
raise the ceiling or move canonical state into presentation children.

The main bundle remains intentionally above Vite's generic warning. Phase 20
protects the measured improvement with explicit byte ceilings; future splitting
must be justified by emitted-asset measurements and startup behavior.

WebGPU remains research debt, not a hidden fallback. It requires a complete
renderer/export/resource-lifecycle implementation and parity benchmarks before
selection can be enabled.

## Release-evidence debt after Phase 35

The remaining work is not permission to add features. It is a closed list of 13 evidence tasks: clean-machine onboarding/install, full dependency-backed gates, native builds/installers, manual visual QA, measured post-build/native performance, release-candidate artifacts, remote CI/tags, official artifacts and authorized publication.

Do not “resolve” this debt by changing support claims, version numbers, evidence status, budgets or workflow guards. Resolve it only with reproducible outputs and evidence-backed fixes.
