# Phase 16.1 - Built-in VFX Preset Catalog

## Requirements

- Attach version, category, tags, localization, thumbnail, quality defaults,
  runtime compatibility, and measured budget metadata to built-in effects.
- Keep `EffectRegistry` authoritative for current runtime definitions and
  `VfxRegistry` authoritative for validated native definitions.
- Reject false stable claims, missing references/assets/localization, corrupt
  plain data, excessive work, and incompatible project schemas.
- Do not count compatibility or experimental entries toward the Phase 16 stable
  preset target.

## Options Considered

1. Enrich `EffectDefinition` directly. This is small, but couples Phase 16
   library concerns to the schema 9 compatibility type and every old caller.
2. Create a second independent preset registry. This is flexible, but creates
   conflicting definition ownership and violates the incremental architecture.
3. Join validated metadata to existing definitions. This adds one read-only
   catalog boundary while preserving both existing authorities. Selected.

## Data Flow

```text
EffectRegistry ----> legacy adapter ----> VfxRegistry
      |                                      |
      +---------- metadata join -------------+
                         |
                         v
              BuiltinVfxPresetCatalog
                         |
              validation / frozen views
                         |
                         v
                 Effects Library UI
```

## Failure Model

Catalog construction fails closed on duplicate or malformed IDs, definition
mismatch, invalid native schemas, missing localization/assets, unsupported
quality/schema ranges, unsafe metadata records/accessors, duration overflow,
or per-preset work outside primitive/global caps.

Existing entries are marked `compatibility`; `colorGradeKeyframe` is
`experimental` and disabled because no visual runtime is connected. Stable
status requires native primitives, preview and export support, and a ready
thumbnail.

## ADR

Status: Accepted.

Use a frozen metadata join over existing registries. Never persist catalog
metadata in project instances and never create a second effect definition
authority. Later Phase 16 content may add native definitions and recipes behind
the same catalog contract.
