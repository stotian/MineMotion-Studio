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
- Added the bounded procedural-animation contract and an editable deterministic
  idle-breathing generator with localized Rig Studio controls.
- Added architecture source-size validation, GitHub CI, strict VFX package
  SemVer precedence, and a reproducible manual smoke checklist.

## 0.8.2

- Last explicitly versioned pre-1.0 application baseline. Later phase work
  remains unreleased until an explicit version checkpoint.
