# Phase 20.8 - Asset ownership, lazy loading, and disposal

## Outcome

Runtime GPU caches are instance-safe and renderer-owned. Persistent project
payloads remain the single asset authority, while expensive OBJ parsing and
texture creation happen only for active render consumers.

## Ownership map

| Asset/resource | Persistent authority | Runtime owner | Load/invalidation | Disposal |
| --- | --- | --- | --- | --- |
| OBJ source | `project.assets.obj[].rawObj` | `SceneRenderer` `ObjAssetCache` | First visible object/attachment; prune on hidden, removed, or changed source | Shared template geometry/material on prune/shutdown |
| Resource-pack texture | Embedded resource-pack data URL | Renderer `MinecraftMaterialCache` | First resolved visible block; clear on material/pack signature change | Texture then material on clear/shutdown |
| Skin texture | Character/project skin data URL | Renderer `SteveRigTextureCache` | First visible skinned rig; prune with visible skin set | Texture on prune/shutdown |
| World/chunk payload | Project world data | Project plus scene tree | Meshes rebuilt from current bounded data | Owned tree disposal |
| VFX package/preset payload | Project/local registry plain data | Existing VFX runtime and pool | Prepared only for active effects | Frame tree/pool lifecycle |
| Imported audio | Project audio data URL | `AudioManager` or one export operation | Playback/mixdown demand | Element/context/nodes from Phase 20.4 |
| Texture atlas/image decode | Operation-local input/output | Atlas/import operation | Explicit build/import call | Browser objects become unreachable; output is plain data |

Module-level fallback rig materials are immutable application-lifetime
constants. They contain no loaded texture and are intentionally shared. The
legacy public material/skin helper functions retain default caches for
non-renderer callers and tests; production renderers inject their own owners.

## Lazy OBJ templates

`collectRenderedObjAssetIds` derives consumers from visible scene objects and
visible OBJ attachments on visible characters. `ObjAssetCache` then:

1. parses each active source once per renderer/source revision;
2. disposes parser-created temporary materials;
3. marks template geometry and the neutral material cache-owned;
4. returns deep object-node clones sharing only those immutable resources;
5. prunes resources after the previous scene tree is detached;
6. releases everything on renderer shutdown.

Tests prove that clones have distinct mutable nodes, repeated resolves parse
once, owned scene disposal cannot release template resources, changed/removed
assets invalidate, and the cache owner disposes every resource exactly once.

## Instance-safe texture/material caches

`MinecraftMaterialCache` and `SteveRigTextureCache` are injectable owners.
Separate instances loading identical data create independent resources.
Clearing the first owner disposes only its materials/textures; the second
continues unchanged. The production renderer no longer calls either module
singleton.

## Dormant chunk cache

`ChunkMeshCache` is still unused by the renderer and is not activated without
Phase 20 benchmark evidence. Its replacement, delete, and clear contracts now
dispose complete owned object trees and return aggregate disposal counters,
preventing a future detach-only leak.

## Evidence

- focused asset/cache lifecycle gate: 5 files, 17 tests;
- complete frontend gate: 133 files, 573 tests;
- typecheck, localization, VFX examples, architecture, build, and audit pass;
- `App.tsx`: 2,642 / 2,839 lines;
- production build: 1,882 modules, 1,537.22 kB JavaScript
  (419.45 kB gzip), retaining the known large-chunk warning.
