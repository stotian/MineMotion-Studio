# Master Roadmap: Phases 14-25

MineMotion Studio will progress through small validated milestones. A phase is complete only when behavior, UI, serialization, errors, tests, build, docs, and a commit all exist where applicable.

## Phase 14 - Architecture Consolidation

Audit the current codebase, establish stable IDs/time/scene/serialization/error contracts, define service boundaries, and centralize runtime capability reporting without a rewrite.

## Phase 15 - Native Deterministic VFX Foundation

Make VFX first-class project/timeline objects with seeded frame evaluation, reusable primitives, schema-driven parameters, quality levels, serialization, preview, and export.

## Phase 16 - Built-In VFX Library

Build combat, lightning, fire, magic, atmosphere, screen, and trail presets from shared primitives rather than isolated engines.

## Phase 17 - VFX Editor And Packages

Add stack/node-ready editing, custom preset authoring, `.minemotion-vfx` import/export, validation, metadata, and safe package handling.

## Phase 18 - Localization

Introduce complete English/French localization contracts, language selection, translated UI, content metadata, tests, and fallback behavior.

## Phase 19 - Advanced Rigging And Animation

Implement reliable bone animation, IK, constraints, procedural Minecraft movement, motion tools, and improved Blockbench rig import.

## Phase 20 - Renderer And Performance

Clarify render layers, add pooling/caching/culling/disposal, move safe heavy work to workers, expose diagnostics, and define quality profiles and benchmarks.

## Phase 21 - Production World Pipeline

Improve Java world reliability, region tools, resource packs, environments, read-only scene overrides, and portable world caches.

## Phase 22 - Professional Shot Workflow

Add shots, takes, storyboard cards, typed markers, production validation, render handoff, and honest render passes without building an NLE.

## Phase 23 - Plugin SDK And Content Packs

Separate safe data packs from sandboxed logic, publish stable SDK contracts/examples, enforce compatibility/permissions, and add a local extension manager.

## Phase 24 - Reliability And Desktop Release

Harden recovery, diagnostics, accessibility, native files, installers, release channels, QA, and developer/user documentation.

## Phase 25 - Future Frontier

Rank AI, collaboration, crowds, physics, advanced rendering, mocap, and community systems by user value, feasibility, differentiation, performance, maintenance, and risk before implementing one.

## Continuation Rule

Read `PHASE_PROGRESS.md`, `CURRENT_STATE.md`, and `NEXT_SESSION.md`; resolve unfinished work before starting the next milestone. Repository reality wins over the roadmap.
