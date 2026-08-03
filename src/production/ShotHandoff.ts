import { createRenderJob, type RenderJob } from "../export/renderQueue/RenderJob";
import { sanitizeOutputName } from "../export/ExportSettings";
import type { MineMotionProject } from "../project/ProjectFile";
import type { ProductionShot, RenderPassId } from "./ShotTypes";

export interface ShotHandoffManifest {
  schemaVersion: 1;
  projectName: string;
  shot: {
    id: string;
    takeGroupId: string;
    name: string;
    takeNumber: number;
    revision: number;
    status: string;
    frameRange: [number, number];
    durationFrames: number;
    fps: number;
    timecodeStart: string;
    cameraId: string;
    notes: string;
  };
  output: {
    root: string;
    shotFolder: string;
    namingPattern: string;
    passes: Array<{ id: RenderPassId; folder: string; fileStem: string }>;
    audioFolder: string;
    metadataFilename: string;
    previewFilename: string;
  };
  editorHandoff: {
    pngSequence: boolean;
    wavMixdown: boolean;
    edl: "not-advertised";
    xml: "not-advertised";
  };
}

export function createShotHandoffManifest(
  project: MineMotionProject,
  shot: ProductionShot
): ShotHandoffManifest {
  const shotFolder = sanitizeSegment(shot.outputFolder || shot.name);
  const fileStem = sanitizeOutputName(shot.outputName || shot.name);
  return {
    schemaVersion: 1,
    projectName: project.projectName,
    shot: {
      id: shot.id,
      takeGroupId: shot.takeGroupId,
      name: shot.name,
      takeNumber: shot.takeNumber,
      revision: shot.revision,
      status: shot.status,
      frameRange: [shot.startFrame, shot.endFrame],
      durationFrames: shot.endFrame - shot.startFrame + 1,
      fps: shot.renderPreset.fps,
      timecodeStart: frameToTimecode(shot.startFrame, shot.renderPreset.fps),
      cameraId: shot.cameraId,
      notes: shot.notes
    },
    output: {
      root: project.production.handoffRoot,
      shotFolder,
      namingPattern: project.production.namingPattern,
      passes: shot.renderPasses.map((pass) => ({
        id: pass,
        folder: `${shotFolder}/${pass}`,
        fileStem: resolveShotOutputName(project.production.namingPattern, shot, pass)
      })),
      audioFolder: `${shotFolder}/audio`,
      metadataFilename: `${shotFolder}/metadata.json`,
      previewFilename: `${shotFolder}/preview.webm`
    },
    editorHandoff: {
      pngSequence: true,
      wavMixdown: true,
      edl: "not-advertised",
      xml: "not-advertised"
    }
  };
}

export function createShotRenderJobs(
  project: MineMotionProject,
  shot: ProductionShot
): RenderJob[] {
  return shot.renderPasses.map((pass) => {
    const outputName = resolveShotOutputName(project.production.namingPattern, shot, pass);
    return createRenderJob(
      {
        ...shot.renderPreset,
        startFrame: shot.startFrame,
        endFrame: shot.endFrame,
        cameraId: shot.cameraId,
        renderPass: pass,
        postProcessingOverride: shot.postProcessingOverride,
        transparentBackground: pass === "alpha" || pass === "vfx",
        includeVfx: pass === "beauty" || pass === "alpha" || pass === "vfx",
        includePostProcessing: pass === "beauty" || pass === "alpha",
        includeCinematicBars: pass === "beauty",
        outputName
      },
      { name: `${shot.name} / ${pass}` }
    );
  }).map((job) => ({
    ...job,
    production: {
      shotId: shot.id,
      takeGroupId: shot.takeGroupId,
      takeNumber: shot.takeNumber,
      revision: shot.revision,
      renderPass: job.settings.renderPass,
      outputFolder: shot.outputFolder
    }
  }));
}

export function resolveShotOutputName(
  pattern: string,
  shot: ProductionShot,
  pass: RenderPassId
): string {
  return sanitizeOutputName(
    pattern
      .replaceAll("{shot}", shot.outputName || shot.name)
      .replaceAll("{take}", String(shot.takeNumber).padStart(2, "0"))
      .replaceAll("{revision}", String(shot.revision).padStart(2, "0"))
      .replaceAll("{pass}", pass)
  );
}

export function frameToTimecode(frame: number, fps: number): string {
  const safeFps = Math.max(1, Math.round(fps));
  const total = Math.max(0, Math.round(frame));
  const frames = total % safeFps;
  const secondsTotal = Math.floor(total / safeFps);
  const seconds = secondsTotal % 60;
  const minutesTotal = Math.floor(secondsTotal / 60);
  const minutes = minutesTotal % 60;
  const hours = Math.floor(minutesTotal / 60);
  return [hours, minutes, seconds, frames]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function sanitizeSegment(value: string): string {
  return value.trim().replace(/[\\/:*?"<>|]+/g, "-") || "shot";
}
