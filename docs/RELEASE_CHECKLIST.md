# Release checklist

1. Run locked install, typecheck, tests, locale/VFX/architecture/performance checks, production build and high-severity audit.
2. Run Rust format, tests and Tauri builds on Windows, macOS and Linux.
3. Exercise new/legacy/corrupt project opening, autosave restore/discard, safe mode and extension crashes.
4. Exercise native open/save, recent files, file associations and restricted filesystem behavior.
5. Test FFmpeg detection, allowed codecs, cancellation, failed output and staging cleanup with a real executable.
6. Inspect installers on clean machines. Sign only through protected release infrastructure.
7. Mark channel as development, beta or stable. Never call an unsigned or untested artifact stable.
8. Run `npm run verify:v1-gate`; it must report `V1_COMPLETE` from attached evidence, not a manually forced status.
9. Align package/Tauri/Cargo versions, tag, changelog, context and artifacts only after every earlier item passes.
10. Publish only after explicit protected-environment authorization.
