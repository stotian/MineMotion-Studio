import type { MinecraftSkinAsset } from "./RigTypes";

/**
 * Generates the default 64x64 rig skin: a neutral light-grey mannequin, the way
 * 3D packages ship an untextured default character. Keeping it neutral means the
 * viewport lighting does the shape-reading work, and it contains no third-party
 * artwork — users import their own skin to texture the rig.
 *
 * BlockMotion Studio is not affiliated with or endorsed by Mojang Studios.
 */

// Neutral mannequin palette. The steps are deliberately small: enough to read
// the silhouette in the viewport, not so much that it looks "painted".
const PAL = {
  torso: "#dcdcdc",
  head: "#e2e2e2",
  limb: "#d0d0d0",
  seam: "#bcbcbc"
} as const;

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

/**
 * Paints one 16x16 limb atlas block: flat limb tone with a darker ring at the
 * shoulder/hip end so joints stay legible when the rig is posed.
 */
function paintLimb(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  rect(ctx, PAL.limb, x, y, 16, 16);
  rect(ctx, PAL.seam, x, y + 4, 16, 1);
}

function paintSkin(ctx: CanvasRenderingContext2D): void {
  // Transparent by default; only body parts are opaque.
  ctx.clearRect(0, 0, 64, 64);

  // ---- Head (atlas 0,0 .. 32,16) ----
  rect(ctx, PAL.head, 8, 0, 8, 8); // top
  rect(ctx, PAL.head, 16, 0, 8, 8); // bottom
  rect(ctx, PAL.head, 0, 8, 32, 8); // right / front / left / back
  // A faint brow line marks the front so the rig's facing is unambiguous.
  rect(ctx, PAL.seam, 9, 11, 2, 1);
  rect(ctx, PAL.seam, 13, 11, 2, 1);

  // ---- Body (atlas 16,16 .. 40,32) ----
  rect(ctx, PAL.torso, 16, 16, 24, 16);
  rect(ctx, PAL.seam, 16, 16, 24, 1); // shoulder seam

  // ---- Arms ----
  paintLimb(ctx, 40, 16); // right arm
  paintLimb(ctx, 32, 48); // left arm (modern atlas)

  // ---- Legs ----
  paintLimb(ctx, 0, 16); // right leg
  paintLimb(ctx, 16, 48); // left leg (modern atlas)
}

let cachedDataUrl: string | null = null;

/** Returns a cached 64x64 PNG data URL for the default skin, or null (no DOM). */
export function getDefaultRigSkinDataUrl(): string | null {
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
export function createDefaultRigSkin(): MinecraftSkinAsset | null {
  const dataUrl = getDefaultRigSkinDataUrl();
  if (!dataUrl) return null;
  return {
    id: "skin-default-rig",
    name: "Default Rig",
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
