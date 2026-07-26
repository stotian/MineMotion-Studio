# Changelog

## Unreleased

- Migrated projects to schema 10 with native deterministic VFX persistence.
- Added the stable built-in VFX library, safe VFX authoring/packages, and
  English/French localization.
- Consolidated global rig animation authority and added deterministic Steve/Alex
  two-bone IK controls, live preview, and timeline baking.
- Added deterministic imported/preset terrain sampling and atomic grounded
  left/right foot-lock range baking.
- Added bounded head, camera, and object look-at preview with animated target
  selection and atomic bake to existing rotation tracks.
- Added derived character root, left/right hand, and camera motion paths with
  timeline ranges, key points, statistics, and export-safe viewport overlays.
- Evolved the existing NLA tracks into six bounded animation layers with scoped
  override/additive blending, mute/weight controls, shared production sampling,
  and VFX synchronization metadata.
- Added ten bounded deterministic procedural rig generators for idle, locomotion,
  jump/landing, recoil/hit, sword swing, and turn motion with editable outputs
  and localized Rig Studio controls.
- Added selection-scoped redundant-key cleanup, bounded noise reduction,
  smoothing, duration-bounded loop, easing-aware reverse, and rig/transform
  mirror tools to the existing animation command bar.
- Added a session-only rig pose clipboard with compatible-bone paste, bounded
  blending, no-op-aware mirror/reset, and localized Rig Studio controls.
- Added validated rig attachment controls, parent-bone animation coverage, and
  real imported OBJ rendering through the shared preview/export scene path.
- Improved Blockbench import with bounded current outliners, nested pivots and
  rotations, deterministic static OBJ output, preserved texture/clip metadata,
  reconciled persistence, and localized capability reports.
- Added architecture source-size validation, GitHub CI, strict VFX package
  SemVer precedence, and a reproducible manual smoke checklist.

## 0.8.2

- Last explicitly versioned pre-1.0 application baseline. Later phase work
  remains unreleased until an explicit version checkpoint.
