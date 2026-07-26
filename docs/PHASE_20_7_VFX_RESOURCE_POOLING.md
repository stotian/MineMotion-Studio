# Phase 20.7 - VFX resource pooling

## Outcome

The production renderer now reuses equivalent fixed VFX geometry, material
slots, particle `InstancedMesh` objects, and their matrix buffers across scene
rebuilds. Pool ownership is bounded, deterministic, session-only, and released
fully with the renderer.

## Ownership and bounds

- one lazy shared unit cube serves native particle emitters and legacy glow
  bursts; per-instance scale preserves the earlier visible size;
- one lazy shared unit sphere serves light pulses; object scale preserves the
  evaluated radius;
- up to 512 mesh and 512 line material slots are unique within an active frame
  and safely reusable after the prior scene tree is detached;
- up to 128 particle meshes retain dynamic instance-matrix capacity; a larger
  later request disposes and replaces only that undersized slot;
- resources beyond any cap are not retained by the pool and use ordinary
  scene-tree disposal;
- shutdown disposes pooled particle buffers before their fixed geometries and
  materials.

Dynamic `BufferGeometry` lines and shockwave torus geometry remain owned by the
evaluated frame. Their points, radius, and segment topology can differ, so
pooling them as equivalent mutable resources would create stale data or require
a second attribute-lifecycle system.

## Instance-buffer leak fix

Three.js `InstancedMesh.dispose()` emits the event used by the WebGL renderer to
release instance attributes. The general object-tree disposer now calls it for
every owned instanced mesh. Explicitly shared particle meshes skip that path and
are released exactly once by the VFX pool instead.

## Reproducible allocation estimate

The bounded pure estimator models 120 steady-state frames containing 64
particle systems, 16 light pulses, 16 dynamic mesh primitives, and 32 dynamic
line primitives per frame.

| Constructor allocations | Before | Pooled | Saved |
| --- | ---: | ---: | ---: |
| Geometries | 15,360 | 5,762 | 9,598 |
| Materials | 15,360 | 128 | 15,232 |
| Particle buffers | 7,680 | 64 | 7,616 |

The result counts dynamic geometry unchanged and includes per-frame overflow
when a test fixture exceeds a configured pool cap. It is an allocation
characterization, not a hardware frame-time claim.

## Evidence

- focused VFX pool/runtime/layer gate: 5 files, 31 tests;
- complete frontend gate: 131 files, 565 tests;
- typecheck, localization, VFX examples, architecture, build, and audit pass;
- `App.tsx`: 2,642 / 2,839 lines;
- production build: 1,881 modules, 1,535.14 kB JavaScript
  (418.80 kB gzip), retaining the known large-chunk warning.
