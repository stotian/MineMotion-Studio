import type { MineMotionProject } from "../project/ProjectFile";
import type { ProductionShot, ShotValidationSnapshot } from "./ShotTypes";

export interface ShotValidationContext {
  projectSaved: boolean;
  ffmpegAvailable?: boolean;
  availableDiskBytes?: number;
  externalPluginIds?: string[];
}

export function validateProductionShot(
  project: MineMotionProject,
  shot: ProductionShot,
  context: ShotValidationContext
): ShotValidationSnapshot {
  const errors: string[] = [];
  const warnings: string[] = [];
  const camera = project.scene.cameras.find((candidate) => candidate.id === shot.cameraId);
  if (!camera) errors.push("The shot camera is missing.");
  if (shot.startFrame < 0 || shot.endFrame < shot.startFrame || shot.endFrame > project.animation.durationFrames) {
    errors.push("The shot frame range is outside the project timeline.");
  }
  if (!shot.enabled) warnings.push("The shot is disabled and will be skipped by Render All.");
  if (!context.projectSaved) warnings.push("Save the project before a production render.");
  if (project.assetLibrary.warnings.length > 0) {
    warnings.push(`${project.assetLibrary.warnings.length} asset warning(s) remain.`);
  }
  if (project.world?.sourcePathMissing && !project.world.cachedMesh?.embedded) {
    errors.push("The Minecraft world source is unavailable and no portable cache is embedded.");
  }
  if (project.minecraftResources.activeResourcePackId &&
      !project.assets.resourcePacks.some((pack) => pack.id === project.minecraftResources.activeResourcePackId)) {
    errors.push("The selected resource pack is missing.");
  }
  const activeEffects = project.effects.instances.filter((effect) =>
    effect.enabled && effect.startFrame <= shot.endFrame &&
    effect.startFrame + Math.max(1, effect.durationFrames) >= shot.startFrame
  );
  const missingVfx = activeEffects.filter((effect) =>
    effect.nativeVfx?.customRecipe !== undefined && !effect.nativeVfx.customRecipe.source.packageId
  );
  if (missingVfx.length > 0) errors.push(`${missingVfx.length} VFX dependency reference(s) are incomplete.`);
  if ((context.externalPluginIds?.length ?? 0) > 0) {
    warnings.push(`External extensions are involved: ${context.externalPluginIds?.join(", ")}.`);
  }
  if (shot.renderPreset.width < 320 || shot.renderPreset.height < 180) {
    warnings.push("Output resolution is unusually small.");
  }
  if (shot.renderPreset.fps !== project.animation.fps) {
    warnings.push("Shot FPS differs from the project FPS.");
  }
  if (shot.renderPreset.includeAudio && project.audio.clips.length === 0) {
    warnings.push("Audio is enabled but the project has no audio clips.");
  }
  const nativeFormat = ["mp4_video", "mp4_h264", "mp4_h265", "prores_video", "mp3_audio"].includes(shot.renderPreset.format);
  if (nativeFormat && context.ffmpegAvailable === false) {
    errors.push("The selected codec requires a working FFmpeg installation.");
  }
  const estimate = estimateShotOutputBytes(shot);
  if (typeof context.availableDiskBytes === "number" && estimate > context.availableDiskBytes) {
    errors.push("The estimated output exceeds the available disk space.");
  } else if (typeof context.availableDiskBytes !== "number") {
    warnings.push("Disk space could not be checked in this runtime.");
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    checkedAt: new Date().toISOString()
  };
}

export function estimateShotOutputBytes(shot: ProductionShot): number {
  const frameCount = Math.max(1, shot.endFrame - shot.startFrame + 1);
  const pixels = shot.renderPreset.width * shot.renderPreset.height;
  const passMultiplier = Math.max(1, shot.renderPasses.length);
  const formatMultiplier = shot.renderPreset.format === "png_sequence" ? 1.35 : 0.18;
  return Math.ceil(frameCount * pixels * 4 * formatMultiplier * passMultiplier);
}
