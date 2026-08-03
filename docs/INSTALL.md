# Installation

## Web development

Requirements: a current Node.js LTS release and npm.

```bash
npm ci
npm run dev
```

## Desktop development

Install the platform prerequisites for Tauri 2 and a current Rust toolchain,
then run:

```bash
npm ci
npm run tauri:dev
```

## Production checks

Run the complete checklist in `RELEASE_CHECKLIST.md`. A source archive without a
successful npm, Cargo, installer, and signing gate is a development artifact,
not an official release.
