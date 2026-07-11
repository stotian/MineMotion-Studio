# MineMotion Studio Contributor Guide

This repository is developed through long, validated phases. Read this file before making substantial changes.

## Start Here

1. Read `docs/PHASE_PROGRESS.md`.
2. Read `docs/CURRENT_STATE.md`.
3. Read `docs/NEXT_SESSION.md`.
4. Read relevant entries in `docs/TECHNICAL_DECISIONS.md`.
5. Run `git status --short --branch` and inspect recent commits.

Repository code and Git history are the source of truth. Correct stale documentation when it conflicts with the implementation.

## Product Boundary

MineMotion Studio is a Minecraft cinematic animation tool, not a general Blender replacement or full video editor. Prioritize Minecraft-native worlds, rigs, skins, animation, cameras, VFX, lighting, production organization, and honest export workflows.

## Engineering Rules

- Preserve the existing project and migrate incrementally.
- Reuse current stores, registries, serializers, timeline lanes, and renderer paths.
- Do not create a parallel effect, animation, project, or plugin architecture.
- Keep `.mmsproj` and `.minemotion` backward compatible through tested migrations.
- Use typed contracts and discriminated unions for serialized data.
- Keep modules focused; avoid adding more orchestration to `App.tsx` when a domain controller can own it.
- Prefer deterministic frame evaluation. Do not use uncontrolled randomness in render or VFX evaluation.
- Show only capabilities the current runtime actually supports.
- Do not add buttons that perform no real action.

## Security And Assets

- Never execute arbitrary imported JavaScript, GLSL, or processes.
- External plugins remain disabled unless safely sandboxed and permissioned.
- Native commands must validate paths, arguments, and permissions.
- Never log or persist API keys, tokens, passwords, cookies, or headers.
- Never send private project files to external providers without explicit user action.
- Minecraft world import is read-only.
- Do not bundle proprietary Minecraft assets.

## Validation

For a stable TypeScript milestone run:

```powershell
npm install
npm run typecheck
npm test
npm run build
npm audit
```

When Rust/Tauri changes, also run Cargo format/check/tests from Visual Studio Developer PowerShell and run a Tauri build when the host permits it. Do not claim a release build unless it actually succeeds.

## Git And Handoff

- Review `git diff --check`, `git diff --stat`, and the full relevant diff before committing.
- Use one clear commit per stable milestone or phase.
- Do not commit generated build output or secrets.
- Update progress and handoff documents before stopping.
- When the user says Continue, resume the exact next action in `docs/NEXT_SESSION.md`.
