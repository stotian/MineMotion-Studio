# Plugin Sandbox Notes

Phase 2 does not execute arbitrary external plugin JavaScript.

Current behavior:

- Built-in plugins are normal TypeScript modules bundled with the app.
- External plugin manifests can be documented and inspected later.
- External code execution is disabled by default.

Future safe plugin execution should use:

- Web Worker sandboxing.
- Message-passing APIs with explicit typed capabilities.
- Permission checks before registering templates, presets, importers, exporters,
  or tools.
- No direct filesystem access by default.
- Signed plugins or trusted plugin sources for distribution.
- User-visible permission prompts for risky capabilities.

Do not use `eval`, dynamic script tags, or unsandboxed imported plugin code for
third-party plugins.
