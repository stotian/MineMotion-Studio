import { createPostProcessingPlan, getPostOperation } from "./PostProcessingPlan";
import type { PostProcessingSettings } from "./PostProcessingTypes";

export function applyCanvasPostProcessing(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  settings: PostProcessingSettings,
  frameSeed: number,
  quality: "draft" | "final" = "final"
): void {
  const plan = createPostProcessingPlan(settings, quality);
  if (!plan.enabled) return;
  const { width, height } = canvas;
  const bloom = getPostOperation(plan, "bloom");
  if (bloom.enabled) {
    context.save();
    context.globalCompositeOperation = "screen";
    context.globalAlpha = Math.min(0.5, bloom.amount * 0.35);
    context.filter = `blur(${Math.max(1, Math.round(2 + bloom.amount * 7))}px)`;
    context.drawImage(canvas, 0, 0);
    context.restore();
  }
  const chromatic = getPostOperation(plan, "chromatic");
  if (chromatic.enabled) {
    const offset = Math.max(1, Math.round(chromatic.amount * Math.min(width, height) * 0.012));
    context.save(); context.globalCompositeOperation = "screen"; context.globalAlpha = Math.min(0.3, chromatic.amount * 0.35);
    context.drawImage(canvas, offset, 0); context.drawImage(canvas, -offset, 0); context.restore();
  }
  const pixelate = getPostOperation(plan, "pixelate");
  if (pixelate.enabled) {
    const scale = Math.max(0.08, 1 - pixelate.amount * 0.9);
    const smallWidth = Math.max(1, Math.round(width * scale));
    const smallHeight = Math.max(1, Math.round(height * scale));
    const scratch = document.createElement("canvas"); scratch.width = smallWidth; scratch.height = smallHeight;
    const scratchContext = scratch.getContext("2d");
    if (scratchContext) {
      scratchContext.drawImage(canvas, 0, 0, smallWidth, smallHeight);
      context.save(); context.imageSmoothingEnabled = false; context.clearRect(0, 0, width, height); context.drawImage(scratch, 0, 0, width, height); context.restore();
    }
  }
  const fog = getPostOperation(plan, "fog");
  if (fog.enabled) {
    context.save(); context.globalAlpha = Math.min(0.85, fog.amount); context.fillStyle = settings.fogColor; context.fillRect(0, 0, width, height); context.restore();
  }
  const vignette = getPostOperation(plan, "vignette");
  if (vignette.enabled) {
    const gradient = context.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.25, width / 2, height / 2, Math.max(width, height) * 0.72);
    gradient.addColorStop(0, "rgba(0,0,0,0)"); gradient.addColorStop(1, "rgba(0,0,0,1)");
    context.save(); context.globalAlpha = Math.min(0.9, vignette.amount); context.fillStyle = gradient; context.fillRect(0, 0, width, height); context.restore();
  }
  const grain = getPostOperation(plan, "grain");
  if (grain.enabled) drawDeterministicGrain(context, width, height, grain.amount, frameSeed);
}

function drawDeterministicGrain(context: CanvasRenderingContext2D, width: number, height: number, amount: number, seed: number): void {
  const points = Math.min(18_000, Math.round(width * height * amount * 0.002));
  let state = (seed ^ 0x9e3779b9) >>> 0;
  context.save(); context.globalAlpha = Math.min(0.22, amount * 0.25); context.fillStyle = "#ffffff";
  for (let index = 0; index < points; index += 1) {
    state = Math.imul(state ^ (state >>> 15), 1 | state); state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    const x = (state >>> 0) % Math.max(1, width); state ^= state >>> 14;
    const y = (state >>> 0) % Math.max(1, height); context.fillRect(x, y, 1, 1);
  }
  context.restore();
}
