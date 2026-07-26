# Manual Smoke Test

This checklist is a reproducible human validation path for a local development
build. Automated tests do not make this checklist pass.

## Start

```powershell
npm ci
npm run dev
```

Open the Vite URL printed by the command, normally
`http://127.0.0.1:5173`. Record the commit, browser/webview, operating system,
date, and each result as `PASS`, `FAIL`, or `BLOCKED`.

## Core project

- Launch the editor and create a project.
- Change a transform, save `.minemotion`, reopen it, and verify the value.
- Undo and redo a visible edit.
- Make an unsaved edit, reload, and verify autosave recovery.

## VFX

- Add and edit a stable built-in VFX preset.
- Move and trim its timeline block.
- Install/add a safe custom VFX package and verify its preview.
- Export a current-frame PNG, a short PNG sequence, and WebM.
- Repeat an export with `includeVfx=false` and verify all VFX layers are absent.

## Localization

- Switch between English and French and reopen the application.
- Verify the selected language persists.
- Inspect long French labels in Settings, VFX Studio, Export, and Rig Studio at
  the minimum supported window size.

## Rig and IK

- Select a Steve or Alex character and open Rig Studio.
- Enable left hand, right hand, left foot, and right foot controls one at a time.
- Edit each local target and pole vector and verify deterministic live preview.
- Check influence at 0, 0.5, and 1.
- Bake at the displayed current frame and verify two global bone tracks appear.
- Undo, redo, save, reopen, and verify the final baked pose.
- Confirm unsupported placeholder rigs show an honest warning and no bake.

## Export

- Export the current frame.
- Export a short PNG sequence and WebM.
- Cancel an export, retry it, and verify application state is restored.

## Current evidence

- Status: `BLOCKED_BY_ENVIRONMENT` until a human or attached browser completes
  the checklist.
- 2026-07-20 Phase 19.3 attempt: the local page navigation timed out and reset
  the integrated browser-control session. Earlier attempts failed bootstrap
  with `Cannot redefine property: process`; no visual PASS is claimed.
