# Next Session

## Exact Current Task

Begin Phase 19.7 with animation layers after the completed and validated
root/hand/camera motion-path workflow.

GitHub publication is externally blocked in this environment: the HTTPS remote
is readable, but no authenticated credential or `gh` executable is available.
Preserve the local commits and push normally once authentication is restored.

## Completed Work

- Phase 15 complete at `7dc093b`.
- One built-in recipe registry resolves 60 native recipes across all required
  Phase 16 content families.
- The catalog contains 72 total entries and every movement parameter has an
  output-influence regression.
- Search, category/tags/source filters, 128 favorites, and 20 recents are live.
- Exactly 60 native presets are stable with deterministic cached previews and
  full integration verification; 12 compatibility entries remain non-stable.
- Four benchmark/regression project fixtures lock dense budget behavior.
- VFX Studio opens from the main toolbar and creates blank or built-in-derived
  immutable drafts over existing Primitive V1 descriptors.
- The versioned authoring contract accepts only bounded primitive, emitter, and
  restricted modifier items; all 60 stable built-ins derive without mutation.
- Pure commands now add/reorder/duplicate/enable/edit/remove items and update
  target/duration/quality; restricted modifiers compile and preview for real.
- Closed manifest V1 and bounded ZIP32 extraction now reject unsafe paths,
  code, archive bombs, undeclared assets, invalid metadata, and bad budgets.
- Canonical byte-stable ZIP export, round-trip rewrite, and pre-install preview/
  dependency/permission/license/asset/budget reports are live in VFX Studio.
- A bounded versioned local registry now installs, updates, enables, disables,
  inspects, and uninstalls canonical packages with dependency protection.
- Every declared asset kind now has a closed bounded resolver; restricted shader
  templates contain parameters only and fallback to Primitive V1 material.
- Enabled installed packages now appear in the existing Effects Library and
  persist compiled descriptors/provenance through schema 10 native VFX.
- Timeline operations, history, JSON/project packages/autosave, preview/export,
  source-status diagnostics, and explicit schema 9 refusal are regression-tested.
- Two deterministic safe example packages, checksum/drift verification, the
  complete author/import guide, and the node-graph research decision are shipped.
- Typed English/French catalogs, system/explicit locale selection, fallback,
  interpolation/plurals/formats, pseudolocalization, and parity validation exist.
- Primary editor, animation, VFX, export, import, settings, plugin, help, and
  shortcut surfaces switch live without mutating project data.
- Stable localized diagnostics, safe package-owned display translations, raw
  string detection, and long French/small-window layout gates are active.
- Existing rig definitions are bounded/validated; invalid vectors, attachments,
  and saved poses are repaired or rejected without changing schema 10.
- Global bone tracks are authoritative and legacy per-character tracks are a
  synchronized compatibility projection across all persistence paths.
- Pure two-bone IK now returns finite analytic positions and hierarchical
  rotations for reachable/clamped targets, pole fallback, limits, and influence.
- Steve/Alex hand/foot controls now preview and bake two authoritative bone
  tracks in one history operation without adding persisted control state.
- Preset terrain generation is renderer-neutral; imported/preset ground sampling
  and bounded fixed-world foot-lock anchors are deterministic and tested.
- Left/right foot ranges sample current animation, transform one ground anchor
  into local IK per frame, and bake atomically with no partial or duplicate keys.
- One pure look-at solver supports renderer-matched `XYZ` and camera `YXZ`,
  quaternion influence, limits, vertical fallback, and hostile-input rejection.
- Head parent-space plus camera/object world-space mapping now supports animated
  target selection, deterministic live preview, and one-key atomic bake.
- Numeric target/influence/maximum-angle controls are localized and session-only;
  existing bone/transform rotation tracks remain authoritative and persistent.
- A bounded motion-path sampler evaluates root, left/right hand, and camera
  points from existing tracks with exact keys, duration, distance, and bounds.
- Relevant tracks are sorted once and sampled with existing interpolation;
  rendered-hand parity is covered without repeated whole-project cloning.
- Localized session controls select a path/range and report statistics; the
  viewport polyline/key points dispose normally and never enter final renders.

## Unfinished Work

- Phase 19.7-19.15 and phases 20-35 remain.

## Next Implementation Step

Inventory the current NLA clip skeleton, global track sampling, and VFX sync
metadata, then define the smallest layer contract for Base Animation, Upper
Body, Head Look, Hand Adjustment, Additive Motion, and VFX Synchronization with
mute, weight, and basic blending.

## Tests To Run

```powershell
npm run typecheck
npx vitest run src/rigs
npm test
npm run build
npm audit
```
