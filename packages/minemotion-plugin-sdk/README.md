# MineMotion Plugin SDK 1.0

Two extension classes exist:

- **content packs** are JSON-only, validated data. They never execute imported code.
- **logic plugins** are executable extensions. External logic is disabled by default and can only communicate through granted message-passing capabilities.

The host never exposes unrestricted filesystem, process, environment, secret, eval, or unrestricted network access. A manifest is not permission to execute. Use `node scripts/validate-extension-package.mjs <manifest.json>` before distribution.

Examples cover a camera pack, a VFX data pack, an importer manifest, and a command worker. The worker examples are development references; MineMotion stable builds still require an allowlisted sandbox host before external logic can run.
