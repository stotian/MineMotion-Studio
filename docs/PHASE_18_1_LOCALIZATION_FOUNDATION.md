# Phase 18.1 - Localization Foundation

This inventory checkpoint is superseded by the completed Phase 18 outcome in
`docs/PHASE_18_LOCALIZATION.md`; the boundaries below describe the initial
foundation before the remaining production surfaces were migrated.

## Inventory

Before this milestone, MineMotion Studio had no application localization
service, no locale preference, and no translation catalog. Twelve major UI
panels plus the command/template/plugin surfaces contained English literals,
and roughly 372 status/error message constructions remained to classify.
Existing locale-related code was limited to deterministic sorting and one safe
VFX package localization asset schema; neither localized the application.

## Implemented contract

- `AppLanguagePreference`: `system`, `en`, or `fr`, persisted in existing app
  settings with safe default repair and no project-schema change.
- English and French flat typed catalogs with exact key/placeholder parity.
- One immutable localization service for system resolution, English fallback,
  interpolation, plural rules, numbers, dates, durations, and timecode.
- Bounded pseudolocalization that preserves interpolation placeholders.
- React context shared by panels without introducing localized project state.
- Live language selection in Settings and complete Top Bar localization as the
  first migrated production surface.
- Automatic missing/extra/empty/placeholder validation and focused tests.

## Boundaries

Technical IDs, serialization values, error codes, project names, file paths,
and user-authored content remain data rather than translated strings. Stable
errors retain their codes; localized error presentation is a later Phase 18
surface milestone. Safe content-package translations will extend this same
catalog boundary rather than execute package logic.
