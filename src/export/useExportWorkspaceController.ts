import { useCallback, useEffect, useRef, useState } from "react";
import * as deferredWorkflows from "../workflows/DeferredWorkflowModules";
import type { LocalizationDiagnosticCode } from "../localization/LocalizationDiagnostics";
import { localizeExportValidationMessage } from "../localization/LocalizationDomainMessages";
import type { LocalizationService } from "../localization/LocalizationService";
import type {
  TranslationKey,
  TranslationValues
} from "../localization/LocalizationTypes";
import type { MineMotionProject } from "../project/ProjectFile";
import { createFinalCameraFrame } from "../rendering/export/FinalCameraRenderer";
import { renderViewportFrameToPng } from "../rendering/export/OfflineFrameRenderer";
import { createRenderStateSnapshot } from "../rendering/export/RenderStateSnapshot";
import { restoreRenderState } from "../rendering/export/RenderStateRestore";
import { downloadBrowserBlob } from "./BrowserDownload";
import { exportCurrentFramePng } from "./FrameExporter";
import {
  createExportProgress,
  IDLE_EXPORT_PROGRESS,
  isExportInProgress
} from "./ExportProgress";
import {
  sanitizeOutputName,
  validateExportSettings,
  withExportSettingsDefaults
} from "./ExportSettings";
import type {
  ExportProgressState,
  ExportResult,
  ExportSettings
} from "./ExportTypes";
import {
  detectFfmpeg,
  WEB_FFMPEG_STATUS
} from "./ffmpeg/FfmpegDetector";
import {
  withFfmpegSettingsDefaults,
  type FfmpegSettings
} from "./ffmpeg/FfmpegSettings";
import { createRenderJob, type RenderJob } from "./renderQueue/RenderJob";
import {
  clearFinishedRenderJobs,
  enqueueRenderJob,
  removeRenderJob,
  replaceRenderJob
} from "./renderQueue/RenderQueue";
import { RenderJobRunner } from "./renderQueue/RenderJobRunner";

type ProjectSetter = (
  updater:
    | MineMotionProject
    | ((currentProject: MineMotionProject) => MineMotionProject)
) => void;

interface ExportWorkspaceOptions {
  project: MineMotionProject;
  localization: LocalizationService;
  setProject: ProjectSetter;
  setDirty: (dirty: boolean) => void;
  setStatus: (status: string) => void;
  tr: (key: TranslationKey, values?: TranslationValues) => string;
  diagnostic: (
    code: LocalizationDiagnosticCode,
    key: TranslationKey,
    values?: TranslationValues
  ) => string;
}

export function useExportWorkspaceController({
  project,
  localization,
  setProject,
  setDirty,
  setStatus,
  tr,
  diagnostic
}: ExportWorkspaceOptions) {
  const [progress, setProgress] = useState(IDLE_EXPORT_PROGRESS);
  const [ffmpegDetection, setFfmpegDetection] =
    useState(WEB_FFMPEG_STATUS);
  const cancelledRef = useRef(false);
  const runnerRef = useRef(new RenderJobRunner());

  useEffect(
    () => () => {
      cancelledRef.current = true;
      runnerRef.current.cancel();
    },
    []
  );

  const updateSettings = useCallback(
    (settings: ExportSettings) => {
      setProject((currentProject) => ({
        ...currentProject,
        exportSettings: withExportSettingsDefaults(settings, currentProject)
      }));
      setDirty(true);
    },
    [setDirty, setProject]
  );

  const updateFfmpegSettings = useCallback(
    (ffmpegSettings: FfmpegSettings) => {
      const nextSettings = withFfmpegSettingsDefaults(ffmpegSettings);
      if (
        nextSettings.executablePath !== project.ffmpegSettings.executablePath
      ) {
        setFfmpegDetection({
          available: false,
          nativeRuntime: ffmpegDetection.nativeRuntime,
          executable: nextSettings.executablePath,
          version: "",
          message: tr("app.ffmpegChanged")
        });
      }
      setProject((currentProject) => ({
        ...currentProject,
        ffmpegSettings: nextSettings
      }));
      setDirty(true);
    },
    [
      ffmpegDetection.nativeRuntime,
      project.ffmpegSettings.executablePath,
      setDirty,
      setProject,
      tr
    ]
  );

  const detectConfiguredFfmpeg = useCallback(async () => {
    setStatus(tr("app.ffmpegDetecting"));
    const result = await detectFfmpeg(project.ffmpegSettings);
    setFfmpegDetection(result);
    setStatus(result.message);
  }, [project.ffmpegSettings, setStatus, tr]);

  const addRenderJob = useCallback(() => {
    const validation = validateExportSettings(project.exportSettings, project, {
      ffmpegAvailable: ffmpegDetection.available,
      ffmpegOutputDirectory: project.ffmpegSettings.outputDirectory
    });
    if (!validation.valid) {
      setStatus(validation.errors.join(" "));
      return;
    }
    const job = createRenderJob(project.exportSettings);
    setProject((currentProject) => ({
      ...currentProject,
      renderQueue: enqueueRenderJob(currentProject.renderQueue, job)
    }));
    setDirty(true);
    setStatus(tr("app.jobAdded", { name: job.name }));
  }, [ffmpegDetection.available, project, setDirty, setProject, setStatus, tr]);

  const removeJob = useCallback(
    (jobId: string) => {
      setProject((currentProject) => ({
        ...currentProject,
        renderQueue: removeRenderJob(currentProject.renderQueue, jobId)
      }));
      setDirty(true);
    },
    [setDirty, setProject]
  );

  const clearFinishedJobs = useCallback(() => {
    setProject((currentProject) => ({
      ...currentProject,
      renderQueue: clearFinishedRenderJobs(currentProject.renderQueue)
    }));
    setDirty(true);
  }, [setDirty, setProject]);

  const runRenderJob = useCallback(
    async (jobId: string) => {
      const job = project.renderQueue.jobs.find((item) => item.id === jobId);
      if (!job || project.renderQueue.activeJobId) return;

      const validation = validateExportSettings(job.settings, project, {
        ffmpegAvailable: ffmpegDetection.available,
        ffmpegOutputDirectory: project.ffmpegSettings.outputDirectory
      });
      if (!validation.valid) {
        setStatus(validation.errors.join(" "));
        return;
      }

      cancelledRef.current = false;
      const snapshot = createRenderStateSnapshot(project);
      const viewportShell = getViewportShell();
      const totalFrames = Math.max(
        1,
        job.settings.endFrame - job.settings.startFrame + 1
      );
      const renderProject = { ...project, exportSettings: job.settings };
      const presentFrame = async (frame: number) => {
        setProject((currentProject) =>
          createFinalCameraFrame(currentProject, job.settings, frame)
        );
        await waitForNextPaint();
      };
      const captureFrame = async (frame: number) => {
        await presentFrame(frame);
        return await renderViewportFrameToPng(
          viewportShell,
          createFinalCameraFrame(renderProject, job.settings, frame),
          job.settings
        );
      };

      try {
        const { executeProductionRenderJob } =
          await deferredWorkflows.loadProductionRenderExecutor();
        const finalJob = await runnerRef.current.run(
          job,
          async (context) =>
            await executeProductionRenderJob({
              job,
              project: renderProject,
              ffmpegSettings: project.ffmpegSettings,
              context,
              adapters: {
                captureFrame,
                download: downloadBrowserBlob
              }
            }),
          (updatedJob) => {
            setProject((currentProject) => ({
              ...currentProject,
              renderQueue: replaceRenderJob(
                currentProject.renderQueue,
                updatedJob
              )
            }));
            setProgress(
              createRenderJobProgress(updatedJob, totalFrames)
            );
          }
        );
        setStatus(finalJob.message);
      } finally {
        setProject((currentProject) =>
          restoreRenderState(currentProject, snapshot)
        );
        setDirty(true);
      }
    },
    [
      ffmpegDetection.available,
      project,
      setDirty,
      setProject,
      setStatus
    ]
  );

  const validateCurrentExport = useCallback(() => {
    const validation = validateExportSettings(project.exportSettings, project);
    if (!validation.valid) {
      const message = validation.errors
        .map((entry) => localizeExportValidationMessage(localization, entry))
        .join(" ");
      setStatus(message);
      setProgress(
        createExportProgress({
          status: "error",
          message: diagnostic("EXPORT_SETTINGS_INVALID", "app.exportInvalid"),
          error: message
        })
      );
      return false;
    }
    if (validation.warnings.length > 0) {
      setStatus(
        validation.warnings
          .map((entry) => localizeExportValidationMessage(localization, entry))
          .join(" ")
      );
    }
    return true;
  }, [diagnostic, localization, project, setStatus]);

  const exportCurrentFrame = useCallback(async () => {
    if (!validateCurrentExport()) return;
    cancelledRef.current = false;
    const snapshot = createRenderStateSnapshot(project);
    const settings = project.exportSettings;
    setProgress(
      createExportProgress({
        status: "preparing",
        message: tr("app.captureFrame")
      })
    );

    try {
      const finalProject = createFinalCameraFrame(
        project,
        settings,
        project.animation.currentFrame
      );
      setProject(finalProject);
      await waitForNextPaint();
      const result = await exportCurrentFramePng(
        getViewportShell(),
        finalProject,
        settings
      );
      downloadExportResult(result);
      setProgress(
        createExportProgress({
          status: "complete",
          currentFrame: 1,
          totalFrames: 1,
          message: tr("app.exported", { filename: result.filename })
        })
      );
      setStatus(tr("app.exported", { filename: result.filename }));
    } catch {
      const message = diagnostic("EXPORT_PNG_FAILED", "app.pngFailed");
      setProgress(
        createExportProgress({
          status: "error",
          message,
          error: message
        })
      );
      setStatus(message);
    } finally {
      setProject((currentProject) =>
        restoreRenderState(currentProject, snapshot)
      );
    }
  }, [
    diagnostic,
    project,
    setProject,
    setStatus,
    tr,
    validateCurrentExport
  ]);

  const exportSequence = useCallback(async () => {
    if (!validateCurrentExport()) return;
    cancelledRef.current = false;
    const snapshot = createRenderStateSnapshot(project);
    const settings = project.exportSettings;
    setProgress(
      createExportProgress({
        status: "preparing",
        message: tr("app.sequencePreparing")
      })
    );

    try {
      const viewportShell = getViewportShell();
      const { exportPngSequenceZip } =
        await deferredWorkflows.loadSequenceExporter();
      const result = await exportPngSequenceZip({
        settings,
        onProgress: setProgress,
        isCancelled: () => cancelledRef.current,
        captureFrame: async (frame) => {
          setProject((currentProject) =>
            createFinalCameraFrame(currentProject, settings, frame)
          );
          await waitForNextPaint();
          return await renderViewportFrameToPng(
            viewportShell,
            {
              ...project,
              animation: {
                ...project.animation,
                currentFrame: frame,
                isPlaying: false
              }
            },
            settings
          );
        }
      });
      downloadExportResult(result);
      setProgress(
        createExportProgress({
          status: "complete",
          currentFrame: settings.endFrame - settings.startFrame + 1,
          totalFrames: settings.endFrame - settings.startFrame + 1,
          message: tr("app.exported", { filename: result.filename })
        })
      );
      setStatus(tr("app.exported", { filename: result.filename }));
    } catch {
      const message = diagnostic(
        "EXPORT_SEQUENCE_FAILED",
        "app.sequenceFailed"
      );
      setProgress(
        createExportProgress({
          status: cancelledRef.current ? "cancelled" : "error",
          message,
          error: cancelledRef.current ? "" : message
        })
      );
      setStatus(message);
    } finally {
      setProject((currentProject) =>
        restoreRenderState(currentProject, snapshot)
      );
    }
  }, [
    diagnostic,
    project,
    setProject,
    setStatus,
    tr,
    validateCurrentExport
  ]);

  const exportWebM = useCallback(async () => {
    if (!validateCurrentExport()) return;
    cancelledRef.current = false;
    const settings = project.exportSettings;
    const snapshot = createRenderStateSnapshot(project);
    const totalFrames = settings.endFrame - settings.startFrame + 1;
    setProgress(
      createExportProgress({
        status: "preparing",
        totalFrames,
        message: tr("app.webmRecording")
      })
    );

    try {
      const viewportShell = getViewportShell();
      const { recordCapturedFramesWebM } =
        await deferredWorkflows.loadWebMRecorder();
      const blob = await recordCapturedFramesWebM({
        startFrame: settings.startFrame,
        endFrame: settings.endFrame,
        fps: settings.fps,
        width: settings.width,
        height: settings.height,
        quality: settings.quality,
        isCancelled: () => cancelledRef.current,
        captureFrame: async (frame) => {
          setProject((currentProject) =>
            createFinalCameraFrame(currentProject, settings, frame)
          );
          await waitForNextPaint();
          return await renderViewportFrameToPng(
            viewportShell,
            createFinalCameraFrame(project, settings, frame),
            settings
          );
        },
        onFrame: (_frame, index) => {
          setProgress(
            createExportProgress({
              status: "rendering",
              currentFrame: index,
              totalFrames,
              message: tr("app.recordingFrame", {
                frame: index,
                total: totalFrames
              })
            })
          );
        }
      });
      const filename = `${sanitizeOutputName(settings.outputName)}.webm`;
      downloadBrowserBlob(blob, filename);
      setProgress(
        createExportProgress({
          status: "complete",
          currentFrame: totalFrames,
          totalFrames,
          message: tr("app.exported", { filename })
        })
      );
      setStatus(
        tr("app.exportedSize", {
          filename,
          width: settings.width,
          height: settings.height
        })
      );
    } catch {
      const message = diagnostic("EXPORT_WEBM_FAILED", "app.webmFailed");
      setProgress(
        createExportProgress({
          status: cancelledRef.current ? "cancelled" : "error",
          message,
          error: cancelledRef.current ? "" : message
        })
      );
      setStatus(message);
    } finally {
      setProject((currentProject) =>
        restoreRenderState(currentProject, snapshot)
      );
    }
  }, [
    diagnostic,
    project,
    setProject,
    setStatus,
    tr,
    validateCurrentExport
  ]);

  const exportWav = useCallback(async () => {
    cancelledRef.current = false;
    setProgress(
      createExportProgress({
        status: "encoding",
        message: tr("app.wavMixing")
      })
    );

    try {
      const { exportProjectWav } =
        await deferredWorkflows.loadAudioMixdown();
      const blob = await exportProjectWav(project, {
        startFrame: project.exportSettings.startFrame,
        endFrame: project.exportSettings.endFrame
      });
      const filename =
        `${sanitizeOutputName(project.exportSettings.outputName)}.wav`;
      downloadBrowserBlob(blob, filename);
      setProgress(
        createExportProgress({
          status: "complete",
          currentFrame: 1,
          totalFrames: 1,
          message: tr("app.exported", { filename })
        })
      );
      setStatus(tr("app.exported", { filename }));
    } catch {
      const message = diagnostic("EXPORT_WAV_FAILED", "app.wavFailed");
      setProgress(
        createExportProgress({
          status: "error",
          message,
          error: message
        })
      );
      setStatus(message);
    }
  }, [diagnostic, project, setStatus, tr]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    runnerRef.current.cancel();
    setProgress(
      createExportProgress({
        status: "cancelled",
        message: tr("app.exportCancel")
      })
    );
    setStatus(tr("app.exportCancel"));
  }, [setStatus, tr]);

  return {
    progress,
    isExporting: isExportInProgress(progress),
    ffmpegDetection,
    updateSettings,
    updateFfmpegSettings,
    detectFfmpeg: detectConfiguredFfmpeg,
    addRenderJob,
    runRenderJob,
    removeRenderJob: removeJob,
    clearFinishedRenderJobs: clearFinishedJobs,
    exportCurrentFrame,
    exportSequence,
    exportWebM,
    exportWav,
    cancel
  };
}

export function createRenderJobProgress(
  job: Pick<RenderJob, "status" | "progress" | "message" | "error">,
  totalFrames: number
): ExportProgressState {
  const status =
    job.status === "complete"
      ? "complete"
      : job.status === "cancelled"
        ? "cancelled"
        : job.status === "error"
          ? "error"
          : job.progress >= 0.85
            ? "encoding"
            : "rendering";
  return createExportProgress({
    status,
    currentFrame: Math.round(job.progress * totalFrames),
    totalFrames,
    message: job.message,
    error: job.error
  });
}

function getViewportShell(): HTMLElement {
  const shell = document.querySelector<HTMLElement>(".viewport-shell");
  if (!shell) throw new Error("Viewport is not mounted.");
  return shell;
}

function downloadExportResult(result: ExportResult): void {
  downloadBrowserBlob(result.blob, result.filename);
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}
