# Next session

Do not restart Phases 20–35. The source implementation and release engineering are present on the local completion branch. The remaining work is evidence collection and evidence-backed fixes only.

## Required order

1. Restore the source archive or Git bundle and verify the recorded HEAD/checksums.
2. Configure a complete npm registry, then run `npm ci`, full typecheck, Vitest, locale/example/architecture gates, Vite build, performance regression check, and `npm audit --audit-level=high`.
3. Install Rust and execute Cargo format/test/build plus Tauri builds.
4. Produce native installers on every platform intended for support; run clean install, upgrade, uninstall, file association/open/save, recovery, optional FFmpeg, and project-preservation smoke tests.
5. Complete `docs/MANUAL_VISUAL_QA.md` at 1080p, high DPI, and small-window sizes for every primary workflow.
6. Record measured post-build and native performance evidence.
7. Reconcile the local branch with GitHub, push it, and require green remote CI.
8. Update only evidence-backed failures. Do not change `distribution/v1-release-evidence.json` to `pass` without attaching the result.
9. After every gate is green and publication is explicitly authorized: align versions to 1.0.0, generate signed artifacts/checksums/notes, create the repository-policy tag, push, and publish.

Until then, keep status `V1_BLOCKED`, application version `0.8.2`, and no claimed desktop platform.

## Ultra continuation

The Phase 36–600 registry, master plan and deterministic contract foundation are present. Do not regenerate or renumber the roadmap manually; edit `scripts/generate-ultra-roadmap.mjs`, run `npm run generate:ultra-roadmap`, then run both `npm run verify:ultra-roadmap` and `npm run verify:ultra`.

Resume final artist-facing promotion from **Phase 136**, following `docs/ULTRA_MASTER_PLAN_PHASES_84_600.md`. The 31 typed program engines already execute all Phase 136–600 contracts; promote them into complete commands, editors, previews and UI in small reviewed groups while preserving the single `MineMotionProject.ultra` authority, legacy Phase 36–83 storage and stable Phase 84–600 capability records. Every promoted phase must keep its unique acceptance test green and add visual/native/performance evidence when its gate requires it. Do not mark artistic or platform gates complete without reviewed images, measured hardware evidence and dependency-backed CI.
## Minecraft Director / Studio Pro continuation

Phases 601–1014 are the current real Director/Creation feature layer and must remain green under `npm run verify:director`. Preserve the Studio review/variant sanitizer coverage and the Creation Suite world/model/rig/collision persistence contracts. Read `docs/DIRECTOR_REAL_PHASES_601_715.md`, `docs/DIRECTOR_STUDIO_PRO_PHASES_716_814.md` and `docs/MINECRAFT_CREATION_SUITE_PHASES_815_1014.md` before changing or renumbering it. A new phase counts only when it adds a distinct operation, appears in the Production UI where appropriate, points to an existing source owner, has a unique acceptance ID and is executed by the gate.

Resume after **Phase 1014**. Highest-value next work after dependencies are restored:

1. Run full TypeScript, Vitest and Vite/Tauri builds; fix only reproduced failures.
2. Render and review a bounded imported-world short film that exercises camera cuts, scene-light rigs, multi-rig animation, collisions, VFX, post and preview/final/compositing queue profiles.
3. Add image-based regression evidence for lighting, camera framing, character animation, VFX layers and render passes.
4. Connect physical aperture/focus metadata to a real depth-aware WebGL/offline depth-of-field pass rather than a cosmetic whole-frame blur.
5. Validate imported Vanilla and modded saves against real resource packs/assets, then measure bounded streaming, LOD, auto-rig, collision preflight and ten-shot render-queue performance on real hardware.
6. Preserve fail-closed release status until native installers, codecs, visual QA and remote CI are green.

