# Ultra validation contract

## Automated source gates

`npm run verify:ultra` performs a strict isolated compile of `src/ultra`, then executes the acceptance runner. The runner covers all **565 phases (36–600)** with one explicit phase test per phase, plus **52 dedicated source-foundation tests for Phases 84–135**. The current gate executes **1,263 top-level assertions** plus **7,986 internal phase-contract assertions** across factories, 31 specialized Phase 136–600 program engines, deterministic execution plans, finite outputs, domain budgets, graph cycle rejection, source-data sanitization, exact subdocument round trips and intentionally invalid records.

The normal dependency-backed test suite adds a complete `MineMotionProject` serialization/migration round trip through `ProjectSerializer`.

## Validation levels

1. **PLANNED** — no artifact exists for the phase.
2. **CONFIGURED** — at least one bounded artifact exists.
3. **VALIDATED** — identity, dependencies and phase-specific domain rules pass.
4. **BLOCKED** — one or more phase-specific errors remain.

Warnings such as configuring a phase before one of its dependencies are visible but do not rewrite or delete project data.

`VALIDATED` means the persisted record and its deterministic source contract pass. It does **not** by itself prove the roadmap's visual, native, interoperability, performance or publication fixture gate. Those evidence gates remain separately blocked until their real artifacts are reviewed.

## Bounds

- 512 records maximum per phase.
- 16,384 Ultra records maximum per project.
- 4,096 characters per generic persisted string.
- 8,192 entries per generic persisted array.
- 512 keys per generic persisted object.
- Eight nested generic object levels.
- VFX graphs: 256 nodes, 131,072 particles and 4,096 events per frame maximum.
- Compositing graphs: 128 nodes maximum.
- Volumetric step profiles: 1–512 steps.

## Fail-closed behavior

Unknown arc identifiers, unsafe IDs, non-finite numbers, duplicate record IDs, graph cycles and invalid domain parameters never become silently validated. Phases 36–83 remain in their original typed domain arrays; Phases 84–600 use versioned capability records so extending the roadmap cannot collide with legacy storage. Old schema-10 projects without an `ultra` field receive a fresh empty schema-1 Ultra subdocument and otherwise retain their existing project data.
