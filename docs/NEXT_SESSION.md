# Next Session

## Exact Current Task

Start Phase 15 milestone 15.1: define the native VFX model and compatibility
boundary while preserving every schema 9 `EffectInstance`.

## Files To Inspect First

- `src/effects/EffectTypes.ts`
- `src/effects/EffectRegistry.ts`
- `src/effects/EffectSerializer.ts`
- `src/effects/EffectTimelineTrack.ts`
- `src/project/ProjectFile.ts`
- `src/renderer/SceneRenderer.ts`
- `src/rendering/export/RenderCapture.ts`

## Completed Work

- Phase 14 audit, core contracts, capability registry, service interfaces,
  compatibility adapters, tests, and documentation completed.
- Phase 14 frontend validation: 51 files and 110 tests, build/typecheck/audit green.

## Unfinished Work

- Phase 15 has not started.
- No schema 10 migration or deterministic VFX runtime exists yet.

## Known Error

Release Tauri build is blocked by Windows Smart App Control error 4551. Debug
MSI/NSIS build succeeds. This does not block TypeScript Phase 15.1 work.

## Next Command

```powershell
git status --short --branch; git log -3 --oneline
```

## Next Implementation Step

Map every current `EffectInstance` field and consumer. Then create the smallest
typed Phase 15 model under `src/vfx/core` (`VfxDefinition`, `VfxInstance`,
parameter schema, evaluation context, registry, validator) plus a compatibility
adapter and focused tests. Do not change schema 9 until round-trip preservation
and a schema 10 migration are designed and tested.

## Tests To Run

```powershell
npm run typecheck
npm test -- --run src/vfx src/effects src/project/ProjectSerializer.test.ts
npm run build
```
