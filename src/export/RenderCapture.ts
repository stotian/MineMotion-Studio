import { getEffectProgress, isEffectActive } from "../effects/EffectTypes";
import type { MineMotionProject } from "../project/ProjectFile";
import type { ExportSettings } from "./ExportTypes";

export async function captureViewportPng(
  viewportShell: HTMLElement,
  project: MineMotionProject,
  settings: ExportSettings
): Promise<Blob> {
  const sourceCanvas = viewportShell.querySelector("canvas");
  if (!sourceCanvas) {
    throw new Error("No viewport canvas is available for export.");
  }

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = settings.width;
  outputCanvas.height = settings.height;
  const context = outputCanvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D export context is unavailable.");
  }

  if (!settings.transparentBackground) {
    context.fillStyle = "#000000";
    context.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
  }

  if (settings.includePostProcessing) {
    context.filter = createCanvasFilter(project);
  }
  context.drawImage(sourceCanvas, 0, 0, outputCanvas.width, outputCanvas.height);
  context.filter = "none";

  if (settings.includeVfx) {
    drawScreenEffects(context, project, outputCanvas.width, outputCanvas.height);
  }

  if (settings.includeCinematicBars) {
    drawCinematicBars(context, project, outputCanvas.width, outputCanvas.height);
  }

  return await canvasToBlob(outputCanvas);
}

function createCanvasFilter(project: MineMotionProject): string {
  const post = project.postProcessing;
  if (!post.enabled) return "none";
  const brightness = post.brightness * post.exposure;
  return [
    `brightness(${brightness})`,
    `contrast(${post.contrast})`,
    `saturate(${post.saturation})`,
    `hue-rotate(${post.hueShift}deg)`
  ].join(" ");
}

function drawScreenEffects(
  context: CanvasRenderingContext2D,
  project: MineMotionProject,
  width: number,
  height: number
): void {
  const active = project.effects.instances.filter((effect) =>
    isEffectActive(effect, project.animation.currentFrame)
  );

  for (const effect of active) {
    const progress = getEffectProgress(effect, project.animation.currentFrame);
    const alpha = (effect.parameters.alpha ?? 0.6) * (1 - progress);
    if (["flash", "explosionFlash", "impactFrame"].includes(effect.type)) {
      context.save();
      context.globalAlpha = Math.max(0, alpha);
      context.fillStyle = effect.parameters.color ?? "#ffffff";
      context.fillRect(0, 0, width, height);
      context.restore();
    }

    if (effect.type === "speedLines") {
      context.save();
      context.globalAlpha = 0.3 * (effect.parameters.intensity ?? 1);
      context.strokeStyle = effect.parameters.color ?? "#ffffff";
      for (let index = 0; index < 42; index += 1) {
        const y = (height / 42) * index;
        context.beginPath();
        context.moveTo(width * 0.5, height * 0.5);
        context.lineTo(width, y);
        context.stroke();
      }
      context.restore();
    }

    if (effect.type === "vignettePulse") {
      drawVignette(context, width, height, effect.parameters.alpha ?? 0.55);
    }
  }

  if (project.postProcessing.vignetteAmount > 0) {
    drawVignette(context, width, height, project.postProcessing.vignetteAmount);
  }
}

function drawVignette(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number
): void {
  const gradient = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.25,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(0, 0, 0, ${Math.min(0.88, amount)})`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function drawCinematicBars(
  context: CanvasRenderingContext2D,
  project: MineMotionProject,
  width: number,
  height: number
): void {
  const barsEffect = project.effects.instances.find(
    (effect) =>
      effect.type === "cinematicBars" &&
      isEffectActive(effect, project.animation.currentFrame)
  );
  if (!project.renderSettings.cinematicBarsEnabled && !barsEffect) return;

  const ratio =
    barsEffect?.parameters.barStyle ?? project.renderSettings.cinematicBarsRatio;
  const barHeight = ratio === "16:9" ? height * 0.09 : height * 0.14;
  context.fillStyle = "#000000";
  context.fillRect(0, 0, width, barHeight);
  context.fillRect(0, height - barHeight, width, barHeight);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("PNG capture failed."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}
