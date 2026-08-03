# Contributing

Read `AGENTS.md`, `docs/CURRENT_STATE.md`, and the relevant system document before editing. Inspect existing owners before adding a store or controller. Keep serialized changes migrated and tested. Imported code, shaders, files, and processes must remain bounded and permissioned.

Before a milestone: run typecheck, tests, build, audit, architecture, locale, template, documentation-link, and performance gates. Native changes also require Cargo checks and a Tauri build. Review the full diff, update persistent context, and use one clear commit per green phase.
