# Phase 8: Minecraft Materials And Lighting Studio

Phase 8 adds user-supplied Minecraft resource packs, block texture resolution,
material presets, biome tint controls, an environment timeline, animated time of
day, and a unified Lighting Studio.

## Delivered

- Resource pack import from `.zip` archives and browser folder selection.
- `pack.mcmeta` parsing with string and text-component descriptions.
- Scan of `assets/minecraft/textures/block/*.png` without bundled textures.
- Safe ZIP central-directory reader for stored and deflate entries.
- Texture resolver with per-block candidate lists and palette-color fallback.
- Deterministic texture atlas layout plus browser canvas atlas rendering.
- Nearest-neighbor or linear texture filtering in the Three.js viewport.
- Solid, transparent, leaves, water, glass, torch, glowstone, lava, and
  redstone-lamp material presets.
- Clear Day, Golden Hour, Moonlit Night, Horror Fog, Nether Heat, End Void,
  Storm Fight, and Anime Impact Lighting moods.
- Sun direction/color/intensity, ambient light, shadows, fog, and time-of-day
  controls.
- Biome tint placeholder controls for grass, foliage, and water.
- Environment keyframes for lighting, fog, time of day, bloom, vignette, grain,
  chromatic aberration, exposure, and contrast.
- Schema v7 save/load migration and `.minemotion` resource-pack embedding.

## Data Flow

```text
ZIP or folder files
       |
       v
ResourcePackImporter -> normalized entries -> ResourcePackScanner
       |                                      |
       |                                      +-> pack.mcmeta metadata
       |                                      +-> selected block PNG data
       v
ResourcePackAsset -> project schema v7 -> .minemotion package
       |
       +-> TextureResolver -> texture or palette fallback
       +-> TextureAtlasBuilder -> atlas layout/canvas
       +-> MinecraftMaterialSystem -> Three.js material -> viewport

Lighting Studio -> LightingSettings + post settings -> environment keyframes
       |                                             |
       +-> SkySystem / SceneRenderer                  +-> timeline sky lane
```

## Failure Handling

- Empty folders, malformed `pack.mcmeta`, unsafe paths, invalid ZIP headers,
  encrypted entries, ZIP64 entries, unsupported compression, and oversized
  expanded archives produce explicit errors.
- A missing `pack.mcmeta` is a warning because valid block textures can still be
  used.
- Missing textures fall back to the existing generated block palette.
- Import is committed only after the complete pack has been validated.

## Current Limits

- Animated texture metadata is detected, but animated frames are not played.
- The viewport applies one resolved texture to all cube faces in the MVP. The
  resolver and atlas already expose face-ready data for future per-face meshing.
- The atlas builder produces a real browser canvas atlas, but the current
  instanced renderer uses individual texture maps.
- Emissive presets exist for torch, glowstone, lava, and redstone lamp; world
  decoding still maps unsupported block names to the existing unknown fallback.
- Folder import uses the browser directory-picker attribute. Native Tauri file
  dialogs remain separate work.

## Architecture Decision Record

Title: Normalize resource packs before renderer integration

Status: Accepted

Context: Resource packs may arrive as ZIP files or folder selections and must
remain portable inside project files without tying parsing to Three.js.

Decision: Convert both sources to normalized byte entries, scan them into a
serializable `ResourcePackAsset`, and let pure resolver/material layers consume
that asset.

Consequences: The parser and resolver are directly testable and project files
remain portable. Full per-face atlas remeshing is deferred, so the MVP uses a
single resolved texture per block material.

## Verification

```powershell
npm run typecheck
npm test
npm run build
npm audit
```
