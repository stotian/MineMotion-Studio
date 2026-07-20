# Phase 18 - Localization and Internationalization

## Outcome

MineMotion Studio now provides complete English and French application UI through
one typed localization service. Locale preference is stored in app settings as
`system`, `en`, or `fr`; it never enters or mutates schema 10 project data.

The production shell, status, commands, Settings, Inspector, Outliner, viewport,
timeline/Dopesheet/Graph, Effects Library, VFX Studio, export/render queue, world
import, rig and lighting studios, templates, plugins, shortcuts, onboarding/help,
and major workflow diagnostics consume the same key contract.

## Contracts and safety

- English is the complete fallback catalog; French must have exact key and
  interpolation-placeholder parity.
- Plurals and number/date/duration/timecode formats use locale-aware `Intl`
  primitives behind the service.
- User-facing workflow failures retain stable bracketed technical codes while
  their presentation is localized. Unknown export details are not leaked as raw
  internal English.
- Technical IDs, paths, serialized enum values, project names, and user-authored
  content are never translated.
- A validated bounded `minemotion-localization` package asset may override only
  `package.displayName` and `package.description`. Exact locale then language
  matching is deterministic; the immutable manifest is the fallback. Package
  data cannot override the application catalog or execute code.

## Automated evidence

`npm run verify:locales` covers missing/extra/empty keys, placeholder parity,
system/explicit fallback, interpolation, plurals and formats, pseudolocalization,
project non-mutation, stable diagnostic codes, major raw JSX/dialog strings,
bounded French/pseudolocale lengths, small-window wrapping CSS, and safe VFX
package presentation selection/fallback.

Final gate on 2026-07-20:

- `npm install`: 110 packages, 0 vulnerabilities
- `npm run verify:locales`: 4 files, 11 tests
- focused VFX package regression: 3 files, 11 tests
- `npm run typecheck`: pass
- `npm test`: 88 files, 396 tests
- `npm run build`: 1,823 modules, existing large-chunk warning only
- `npm audit`: 0 vulnerabilities

No Rust/Tauri source changed. The existing in-app browser attachment issue
(`Cannot redefine property: process`) remains an environment limitation; layout
and source coverage are guarded deterministically.
