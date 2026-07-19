import type { MineMotionProject } from "../project/ProjectFile";
import type { ExportSettings } from "./ExportTypes";
import { isSafeVfxColor } from "../vfx/core/VfxParameter";
import {
  getPreparedCameraShakeOffset,
  getPreparedVfxNumber,
  getPreparedVfxString,
  prepareProjectVfxFrame,
  type PreparedProjectVfxEffect
} from "../vfx/runtime/VfxProjectFrame";

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

  const prepared = prepareProjectVfxFrame(project, {
    includeVfx: settings.includeVfx,
    quality: "export"
  });
  if (!prepared.ok) {
    throw new Error(
      `VFX frame preparation failed. ${prepared.errors
        .map((error) => error.message)
        .join(" ")}`
    );
  }

  if (!settings.transparentBackground) {
    context.fillStyle = "#000000";
    context.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
  }

  if (settings.includePostProcessing) {
    context.filter = createCanvasFilter(project);
  }
  const shake = getPreparedCameraShakeOffset(prepared.value.effects);
  context.drawImage(
    sourceCanvas,
    shake.x,
    shake.y,
    outputCanvas.width,
    outputCanvas.height
  );
  context.filter = "none";

  if (settings.includeVfx) {
    drawScreenEffects(
      context,
      prepared.value.effects,
      outputCanvas.width,
      outputCanvas.height
    );
  }

  if (
    settings.includePostProcessing &&
    project.postProcessing.vignetteAmount > 0
  ) {
    drawVignette(
      context,
      outputCanvas.width,
      outputCanvas.height,
      project.postProcessing.vignetteAmount
    );
  }

  if (settings.includeCinematicBars) {
    drawCinematicBars(
      context,
      project,
      prepared.value.effects,
      outputCanvas.width,
      outputCanvas.height
    );
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
  active: readonly PreparedProjectVfxEffect[],
  width: number,
  height: number
): void {
  for (const effect of active) {
    const progress = effect.evaluation.progress;
    const alpha = getPreparedVfxNumber(effect, "alpha", 0.6) * (1 - progress);
    const colorValue = getPreparedVfxString(effect, "color", "#ffffff");
    const color = isSafeVfxColor(colorValue) ? colorValue : "#ffffff";
    if (["flash", "explosionFlash", "impactFrame", "hitStop"].includes(effect.type)) {
      context.save();
      context.globalAlpha = Math.max(0, alpha);
      context.fillStyle = color;
      context.fillRect(0, 0, width, height);
      context.restore();
    }

    if (effect.type === "speedLines") {
      context.save();
      context.globalAlpha =
        0.3 * getPreparedVfxNumber(effect, "intensity", 1);
      context.strokeStyle = color;
      const segments = effect.budget.segments;
      for (let index = 0; index < segments; index += 1) {
        const y = (height / segments) * index;
        context.beginPath();
        context.moveTo(width * 0.5, height * 0.5);
        context.lineTo(width, y);
        context.stroke();
      }
      context.restore();
    }

    if (effect.type === "vignettePulse") {
      drawVignette(
        context,
        width,
        height,
        getPreparedVfxNumber(effect, "alpha", 0.55)
      );
    }
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
  activeEffects: readonly PreparedProjectVfxEffect[],
  width: number,
  height: number
): void {
  const barsEffect = activeEffects.find(
    (effect) => effect.type === "cinematicBars"
  );
  if (!project.renderSettings.cinematicBarsEnabled && !barsEffect) return;

  const ratio =
    (barsEffect
      ? getPreparedVfxString(
          barsEffect,
          "barStyle",
          project.renderSettings.cinematicBarsRatio
        )
      : project.renderSettings.cinematicBarsRatio);
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
