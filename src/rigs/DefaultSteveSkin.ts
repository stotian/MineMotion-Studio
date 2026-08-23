import type { MinecraftSkinAsset } from "./RigTypes";

/**
 * Generates a default, original 64x64 player skin so new characters render as a
 * recognisable textured humanoid instead of flat coloured boxes. The palette is
 * an original interpretation (warm tan skin, teal shirt, indigo trousers) and
 * deliberately does NOT reproduce Mojang's copyrighted "Steve" texture.
 *
 * BlockMotion Studio is not affiliated with or endorsed by Mojang Studios.
 */

// Original palette — intentionally distinct from Mojang's texture.
const PAL = {
  skin: "#c9986a",
  skinShade: "#b8875c",
  hair: "#3b2a17",
  hairHi: "#4a361f",
  eyeWhite: "#e9e5da",
  iris: "#3d6b8a",
  brow: "#2c2013",
  mouth: "#7a4a3a",
  shirt: "#179c9c",
  shirtShade: "#128585",
  sleeve: "#149090",
  pants: "#3c3f86",
  pantsShade: "#333670",
  shoe: "#4a4a52"
} as const;

/** Fill a rectangle of pixels (integer coords) on the skin canvas. */
function rect(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Paint one 8x8 head face region with subtle top-hair fringe + shading. */
function paintHeadFace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  { fringe }: { fringe: boolean }
): void {
  rect(ctx, PAL.skin, x, y, 8, 8);
  if (fringe) rect(ctx, PAL.hair, x, y, 8, 2);
}

function paintSkin(ctx: CanvasRenderingContext2D): void {
  // Transparent everywhere by default; only body parts are opaque.
  ctx.clearRect(0, 0, 64, 64);

  // ---- Head (atlas 0,0 .. 32,16) ----
  rect(ctx, PAL.hair, 8, 0, 8, 8); // top of head: hair
  rect(ctx, PAL.hair, 24, 8, 8, 8); // back of head: hair
  paintHeadFace(ctx, 0, 8, { fringe: true }); // right
  paintHeadFace(ctx, 16, 8, { fringe: true }); // left
  // Front face (8,8): skin with fringe, eyes and mouth.
  rect(ctx, PAL.skin, 8, 8, 8, 8);
  rect(ctx, PAL.hair, 8, 8, 8, 2); // hair fringe
  // Eyes: whites + irises.
  rect(ctx, PAL.eyeWhite, 9, 11, 2, 1);
  rect(ctx, PAL.eyeWhite, 13, 11, 2, 1);
  rect(ctx, PAL.iris, 10, 11, 1, 1);
  rect(ctx, PAL.iris, 13, 11, 1, 1);
  rect(ctx, PAL.brow, 9, 10, 2, 1);
  rect(ctx, PAL.brow, 13, 10, 2, 1);
  // Nose + signature brown moustache/beard + mouth.
  rect(ctx, PAL.skinShade, 11, 12, 2, 1);
  rect(ctx, PAL.hair, 9, 13, 6, 1); // moustache
  rect(ctx, PAL.hair, 9, 14, 1, 1); // left sideburn/beard
  rect(ctx, PAL.hair, 14, 14, 1, 1); // right sideburn/beard
  rect(ctx, PAL.mouth, 10, 14, 4, 1);

  // ---- Body (atlas 16,16 .. 40,32) — teal shirt ----
  rect(ctx, PAL.shirt, 16, 16, 24, 16);
  rect(ctx, PAL.shirtShade, 20, 20, 8, 12); // front torso slightly darker
  rect(ctx, PAL.shirtShade, 16, 16, 24, 1); // top seam

  // ---- Right arm (atlas 40,16 .. 56,32) ----
  rect(ctx, PAL.skin, 40, 16, 16, 16);
  rect(ctx, PAL.sleeve, 40, 16, 16, 5); // short sleeve at shoulder
  rect(ctx, PAL.skinShade, 44, 21, 4, 1);

  // ---- Left arm (modern atlas 32,48 .. 48,64) ----
  rect(ctx, PAL.skin, 32, 48, 16, 16);
  rect(ctx, PAL.sleeve, 32, 48, 16, 5);
  rect(ctx, PAL.skinShade, 36, 53, 4, 1);

  // ---- Right leg (atlas 0,16 .. 16,32) — indigo trousers + shoe ----
  rect(ctx, PAL.pants, 0, 16, 16, 16);
  rect(ctx, PAL.pantsShade, 4, 20, 4, 12);
  rect(ctx, PAL.shoe, 0, 28, 16, 4); // shoe at the ankle

  // ---- Left leg (modern atlas 16,48 .. 32,64) ----
  rect(ctx, PAL.pants, 16, 48, 16, 16);
  rect(ctx, PAL.pantsShade, 20, 52, 4, 12);
  rect(ctx, PAL.shoe, 16, 60, 16, 4);
}

let cachedDataUrl: string | null = null;

/** Returns a cached 64x64 PNG data URL for the default skin, or null (no DOM). */
export function getDefaultSteveSkinDataUrl(): string | null {
  if (cachedDataUrl) return cachedDataUrl;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  paintSkin(ctx);
  cachedDataUrl = canvas.toDataURL("image/png");
  return cachedDataUrl;
}

/** Builds the default skin asset, or null when no canvas is available (tests). */
export function createDefaultSteveSkin(): MinecraftSkinAsset | null {
  const dataUrl = getDefaultSteveSkinDataUrl();
  if (!dataUrl) return null;
  return {
    id: "skin-default-steve",
    name: "BlockMotion Default",
    dataUrl,
    importedAt: new Date(0).toISOString(),
    metadata: {
      width: 64,
      height: 64,
      valid: true,
      legacy: false,
      modelType: "steve",
      warnings: []
    }
  };
}
