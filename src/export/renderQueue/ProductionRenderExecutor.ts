import { exportProjectWav } from "../../audio/export/AudioMixdown";
import type { MineMotionProject } from "../../project/ProjectFile";
import { PackageWriter } from "../../project/package/PackageWriter";
import { sanitizeOutputName } from "../ExportSettings";
import { FfmpegExportSession } from "../ffmpeg/FfmpegExportManager";
import { isNativeExportFormat } from "../ffmpeg/FfmpegCommandBuilder";
import type { FfmpegSettings } from "../ffmpeg/FfmpegSettings";
import { exportPngSequenceZip } from "../SequenceExporter";
import { recordCapturedFramesWebM } from "../video/WebMRecorder";
import type { RenderJob } from "./RenderJob";
import type {
  RenderJobRunContext,
  RenderJobRunResult
} from "./RenderJobRunner";

export interface ProductionRenderAdapters {
  captureFrame: (frame: number) => Promise<Blob>;
  download: (blob: Blob, filename: string) => void;
}

export async function executeProductionRenderJob(options: {
  job: RenderJob;
  project: MineMotionProject;
  ffmpegSettings: FfmpegSettings;
  context: RenderJobRunContext;
  adapters: ProductionRenderAdapters;
}): Promise<RenderJobRunResult> {
  const { job, project, ffmpegSettings, context, adapters } = options;
  const settings = job.settings;
  const totalFrames = settings.endFrame - settings.startFrame + 1;

  if (settings.format === "png_frame") {
    context.report(0.1, "Preparing final camera frame.");
    const blob = await adapters.captureFrame(settings.startFrame);
    context.throwIfCancelled();
    const filename = `${sanitizeOutputName(settings.outputName)}_${String(settings.startFrame).padStart(6, "0")}.png`;
    adapters.download(blob, filename);
    return { message: `Exported ${filename}.` };
  }

  if (settings.format === "png_sequence") {
    const result = await exportPngSequenceZip({
      settings,
      isCancelled: context.isCancelled,
      onProgress: (progress) => {
        const ratio = progress.totalFrames > 0
          ? progress.currentFrame / progress.totalFrames
          : 0;
        context.report(ratio * 0.95, progress.message);
      },
      captureFrame: adapters.captureFrame
    });
    context.throwIfCancelled();
    adapters.download(result.blob, result.filename);
    return { message: `Exported ${result.filename}.` };
  }

  if (settings.format === "webm_video") {
    const blob = await recordCapturedFramesWebM({
      startFrame: settings.startFrame,
      endFrame: settings.endFrame,
      fps: settings.fps,
      width: settings.width,
      height: settings.height,
      quality: settings.quality,
      captureFrame: adapters.captureFrame,
      isCancelled: context.isCancelled,
      onFrame: (_frame, index) => {
        context.report(
          index / totalFrames,
          `Recording frame ${index} of ${totalFrames}.`
        );
      }
    });
    context.throwIfCancelled();
    const filename = `${sanitizeOutputName(settings.outputName)}.webm`;
    adapters.download(blob, filename);
    return { message: `Exported ${filename} at ${settings.width}x${settings.height}.` };
  }

  if (settings.format === "wav_audio") {
    context.report(0.2, "Mixing project audio to WAV.");
    const blob = await exportProjectWav(project, {
      startFrame: settings.startFrame,
      endFrame: settings.endFrame
    });
    context.throwIfCancelled();
    const filename = `${sanitizeOutputName(settings.outputName)}.wav`;
    adapters.download(blob, filename);
    return { message: `Exported ${filename}.` };
  }

  if (settings.format === "minemotion_package") {
    const blob = PackageWriter.write(project);
    const filename = `${sanitizeOutputName(settings.outputName)}.minemotion`;
    adapters.download(blob, filename);
    return { message: `Exported ${filename}.` };
  }

  if (settings.format === "audio_metadata") {
    const blob = new Blob(
      [JSON.stringify({
        schemaVersion: 1,
        fps: project.animation.fps,
        frameRange: [settings.startFrame, settings.endFrame],
        clips: project.audio.clips
      }, null, 2)],
      { type: "application/json" }
    );
    const filename = `${sanitizeOutputName(settings.outputName)}_audio.json`;
    adapters.download(blob, filename);
    return { message: `Exported ${filename}.` };
  }

  if (!isNativeExportFormat(settings.format)) {
    throw new Error(`No production renderer is registered for ${settings.format}.`);
  }

  let session: FfmpegExportSession | null = null;
  try {
    session = await FfmpegExportSession.create(job.id);
    context.log("Created native FFmpeg staging directory.");

    if (settings.format !== "mp3_audio") {
      for (
        let frame = settings.startFrame, index = 0;
        frame <= settings.endFrame;
        frame += 1, index += 1
      ) {
        context.throwIfCancelled();
        const blob = await adapters.captureFrame(frame);
        await session.writeFrame(index + 1, blob);
        context.report(
          ((index + 1) / totalFrames) * 0.82,
          `Staged frame ${index + 1} of ${totalFrames}.`
        );
      }
    }

    const shouldMixAudio = settings.format === "mp3_audio" || settings.includeAudio;
    if (shouldMixAudio) {
      context.throwIfCancelled();
      context.report(0.86, "Mixing audio for FFmpeg.");
      const wav = await exportProjectWav(project, {
        startFrame: settings.startFrame,
        endFrame: settings.endFrame
      });
      await session.writeAudio(wav);
      context.log("Staged WAV audio mixdown.");
    }

    context.throwIfCancelled();
    context.report(0.92, "Encoding with FFmpeg.");
    const plan = await session.finish({
      exportSettings: settings,
      ffmpegSettings,
      audioAvailable: shouldMixAudio
    });
    session = null;
    return {
      message: `FFmpeg export complete: ${plan.outputFilename}.`,
      outputPath: plan.outputPath
    };
  } finally {
    await session?.cleanup();
  }
}
