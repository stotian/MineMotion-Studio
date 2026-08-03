# Phase 26 — Premium UI and workspaces

Status: **LOCAL_COMPLETE**

## Implemented

- Seven persistent workspaces: Layout, Animation, Cinematic, VFX, Lighting,
  Export, and Debug.
- Settings schema 2 stores the active workspace, panel widths, timeline height,
  density, and collapsed panels. Invalid persisted values are bounded and
  repaired without discarding unrelated settings.
- The editor frame has pointer-resizable side panels, explicit collapse/restore
  controls, and a persistent timeline row.
- The top toolbar is consolidated into Project, Scene, and Studios menus while
  retaining direct playback, preview, command, settings, and help actions.
- Save/autosave/render/capability indicators expose state without relying only
  on color.
- Outliner sections are searchable and collapsible; entity visibility, lock,
  active-camera state, missing OBJ assets, placeholder rigs, and camera-state
  drift are visible and actionable.
- Core transform fields are driven by a validated inspector schema.
- Timeline zoom, compact/comfortable density, key navigation, markers, and
  existing selection accessibility are available together.
- The former provisional light-theme control now applies a real light palette.
- The duplicate `Ctrl+S` command was removed and shortcut conflicts have a
  deterministic diagnostic.
- High-DPI and narrow-window CSS rules preserve usable focus targets and
  avoid the former fixed-width application shell.

## Validation

- All TypeScript/TSX sources transpile syntactically.
- Every relative source import resolves.
- English/French catalogs have exact key parity.
- No empty catch or explicit `any` remains in the source audit.
- `App.tsx` and `TimelinePanel.tsx` remain below their architecture ceilings.
- Focused tests cover layout repair/persistence, shortcut conflicts, outliner
  diagnostics, inspector schema, timeline zoom bounds, and the phase acceptance
  path.

## External gate still required

The full Vitest/Vite/browser visual run remains dependent on a successful
locked dependency installation. Workspaces must still receive manual pointer,
keyboard, 1080p, high-DPI, and small-window smoke tests on a real browser build.
