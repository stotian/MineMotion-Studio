# Phase 15.7 - Native VFX Preview/Export Path Inventory

Status: IN_PROGRESS - canonical preparation implemented; renderer/export
integration and parity validation underway.

## Existing Consumer Inventory

| Consumer | Before 15.7 | Divergence found | 15.7 route |
| --- | --- | --- | --- |
| Three.js viewport | Reads legacy world effects directly | Native fields/keyframes ignored | Prepared native active frames |
| React viewport overlays | Independently filters legacy effects | Separate timing/parameter math | Same prepared active frames |
| PNG/current frame | Copies WebGL canvas then redraws some overlays | World VFX could survive `includeVfx=false` | Final-camera presentation plus prepared overlays |
| PNG sequence | Mutates frame, then captures | Did not apply final VFX visibility before paint | Final-camera frame before every capture |
| WebM | Records raw viewport canvas | DOM overlays absent; live resolution only | Record canonical composited PNG frames |
| FFmpeg staging | Uses PNG capture callback | Inherits capture divergence | Same canonical composited frames |
| Package render job | Serializes project | Persistence already canonical in 15.6 | Unchanged schema 10 package path |

## Required Invariants

- One pure preparation call evaluates schema 10 `nativeVfx` for an explicit
  frame, FPS, quality source, context seed, and inclusion flag.
- Playback, stepping, scrubbing, preview, PNG, sequence, WebM, and FFmpeg use
  the same inclusive timing and local parameter-keyframe evaluation.
- `includeVfx=false` short-circuits preparation and final presentation before
  any world, camera, overlay, or post VFX consumer runs.
- Missing entities/bones produce structured warnings and no unsafe lookup.
- Existing legacy visual types remain mapped until visual parity is proven.
- Post-processing and cinematic-bar export toggles remain independent of VFX.

## Architecture Options

### A. Keep independent legacy consumers and add native adapters to each

Estimate: 2-3 days. Low initial churn, but timing, keyframes, target warnings,
quality, and inclusion logic would remain duplicated. Rejected.

### B. Replace every visual with primitive V1 renderers immediately

Estimate: 5-8 days. Clean end state, but the current definitions do not yet own
primitive descriptor graphs and twelve existing presets would change at once.
Rejected for this compatibility milestone.

### C. Share native frame preparation, retain a bounded visual compatibility map

Estimate: 2-4 days. Selected. Native evaluation becomes the runtime authority;
Three.js and screen presentation temporarily map known definition IDs to their
existing meaningful visuals. Primitive rendering can replace mappings one by
one without duplicating project or timeline state.

```text
schema 10 effects.instances[].nativeVfx
                    |
                    v
        prepareProjectVfxFrame(frame, quality, includeVfx)
              |             |               |
              v             v               v
        Three.js world   React preview   Canvas compositor
                                             |
                                  PNG / sequence / WebM / FFmpeg
```

## Failure Handling

- Invalid included native data returns structured errors; capture fails with a
  clear message instead of exporting a partially inconsistent frame.
- Disabled VFX returns an empty prepared frame without inspecting corrupt VFX
  data, guaranteeing complete layer exclusion.
- Missing target entities, non-character bone targets, and absent rig bones
  return warnings and a null resolved target.
- WebM cancellation stops the MediaRecorder in `finally`; presentation bitmaps
  are closed after each frame.
- Render-state snapshots restore camera, timeline, preview flag, and export
  settings after success, failure, or cancellation.

## ADR

Title: Make native VFX frame preparation the shared runtime boundary
Status: Accepted for milestone 15.7
Context: Three.js, React overlays, PNG, WebM, and FFmpeg previously evaluated or
omitted VFX differently, and raw-canvas WebM could not include DOM overlays.
Decision: Evaluate native instances once through a pure prepared-frame contract.
Feed all current visual adapters from that contract, compose WebM from the same
captured frames as PNG/FFmpeg, and short-circuit all layers when disabled.
Consequences: deterministic data parity is testable now while existing preset
appearance is preserved. The compatibility visual map remains temporary until
primitive render parity permits its measured removal.
