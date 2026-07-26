# Phase 20.3 - Renderer layers

## Outcome

MineMotion now has one immutable semantic inventory for the eight required
renderer layer families. Three.js objects are tagged with their primary family
and material pass without changing Three.js camera masks or depth sorting.

| Family | Current owner | Editor | Final |
| --- | --- | ---: | ---: |
| World | `SceneRenderer`, chunk builders, sky/lighting | Yes | Yes |
| Characters | `SceneRenderer`, shared rig builder | Yes | Yes |
| Props | `SceneRenderer`, imported OBJ loader | Yes | Yes |
| Transparency | Cross-cutting Three.js material pass | Yes | Yes |
| VFX | Three.js world VFX plus DOM/Canvas screen VFX | Optional | Optional |
| Post | Viewport CSS plus Canvas2D export composite | Optional | Optional |
| Overlays | Viewport UI and cinematic bars | Yes | Export options |
| Helpers | Grid/axes, selection, cameras, paths, chunk guides | Yes | No |

`RendererLayers` records the owners and eligibility. Scene objects carry
`rendererLayer`, `rendererLayers`, and `rendererPass` metadata. Transparency is
cross-cutting: an object keeps its world/character/prop/VFX owner and also gains
the transparency tag when its material uses Three.js transparency.

## Ordering

### Three.js scene

Three.js remains responsible for depth-correct opaque and transparent sorting.
World, character, prop, and world-VFX tags do not force painter-order rendering.
Motion paths retain their explicit editor-only `renderOrder`; no new global
render-order numbers or camera masks were introduced.

### Interactive viewport

1. Three.js canvas: sky/lights, scene depth passes, and world VFX.
2. Canvas CSS filter: brightness, exposure, contrast, saturation, hue, and
   VFX color drain.
3. DOM screen composition in source order: bloom, chromatic/glitch, fog,
   speed lines, flash, vignette, and grain.
4. Editor toolbar/metrics at UI z-index 2.
5. Cinematic bars at z-index 4.

### Final Canvas2D capture

1. Optional output background.
2. Source WebGL canvas with optional post filter and camera shake.
3. Optional screen VFX.
4. Optional post vignette.
5. Optional cinematic bars.

Editor toolbar and metrics are DOM-only and never copied to the output canvas.

## WebGL helper boundary fixed

The final WebGL canvas now excludes:

- grid and axes;
- selection box;
- camera models/frustums;
- motion paths and key points;
- imported-world chunk borders and origin marker.

The visibility plan is pure and testable. Helper exclusion does not mutate
viewport preferences or project data; returning to editor mode restores the
requested grid visibility.

## Honest parity boundary

Preview CSS and final Canvas2D share prepared project/VFX inputs but are not yet
pixel-identical post pipelines. Generic preview bloom, grain, chromatic
aberration, and fog do not all have equivalent Canvas2D export passes. This is
recorded as an open correctness limitation rather than hidden behind the layer
contract.
