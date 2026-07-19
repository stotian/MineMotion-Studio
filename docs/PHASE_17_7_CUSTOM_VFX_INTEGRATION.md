# Phase 17.7 - Installed Custom VFX Integration

## Outcome

Enabled installed packages are now custom cards in the existing Effects Library.
Adding one creates the schema 10-only `customVfx` carrier in the existing
`effects.instances` collection and canonical effects timeline lane.

`nativeVfx.customRecipe` stores versioned package/document provenance and the
validated compiled Primitive V1 descriptors. Frame preparation selects those
descriptors before built-in lookup and uses the same recipe preflight, quality
scaling, global allocation, evaluator, preview, and export contract.

The local registry is not project authority. It controls new insertion and
source-status diagnostics. Existing effects continue from embedded data when a
source is missing, disabled, or changed. Schema 9 reverse conversion refuses
custom recipes explicitly.

## Persistence evidence

Focused integration coverage verifies timeline insert/move/duplicate, history,
JSON, `.minemotion` project package, autosave, schema 10 validation, hostile
unknown custom fields, shared preview/export evaluation, missing local source,
and schema 9 refusal.

Final milestone gate: 5 focused files/81 tests, full 84 files/384 tests,
typecheck, 1,814-module build, and audit all pass.
