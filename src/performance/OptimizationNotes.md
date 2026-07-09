# MineMotion Performance Notes

- PNG sequence export intentionally renders one frame at a time and yields back to the browser event loop between frames.
- Current browser export reuses the live viewport canvas; the future native renderer can replace this with a fully offline Three.js render target.
- Static terrain and imported model caches should be disposed through the resource tracker when scenes are replaced.
