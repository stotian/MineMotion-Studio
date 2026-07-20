import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AssetManager } from "./assets/AssetManager";
import { ObjImporter } from "./assets/ObjImporter";
import { AudioManager } from "./audio/AudioManager";
import { createBuiltinAudioClip, createImportedAudioClip } from "./audio/AudioClip";
import { findClipsStartingAtFrame } from "./audio/AudioTimelineIntegration";
import { BUILTIN_SFX, getBuiltinSfx } from "./audio/BuiltinSfxRegistry";
import { exportProjectWav } from "./audio/export/AudioMixdown";
import { addTransformKeyframes, setCurrentFrame } from "./animation/Timeline";
import { CommandPalette } from "./commands/CommandPalette";
import { createBuiltinCommands } from "./commands/BuiltinCommands";
import {
  applyEffectTimelineCommand,
  type EffectTimelineCommand,
  type EffectTimelineEditablePatch
} from "./effects/EffectTimelineController";
import type { EffectType } from "./effects/EffectTypes";
import { spawnEffectAtFrame } from "./effects/EffectSpawner";
import { builtinVfxPresetCatalog } from "./vfx/library/BuiltinVfxPresetCatalog";
import {
  createEmptyVfxPackageRegistry,
  loadVfxPackageRegistry,
  type VfxPackageRegistry
} from "./vfx/package/VfxPackageRegistry";
import {
  createInstalledVfxEffect,
  getInstalledVfxSourceStatus,
  listEnabledInstalledVfxPresets
} from "./vfx/package/VfxPackageProjectIntegration";
import { exportCurrentFramePng } from "./export/FrameExporter";
import {
  detectFfmpeg,
  WEB_FFMPEG_STATUS,
  type FfmpegDetectionResult
} from "./export/ffmpeg/FfmpegDetector";
import {
  withFfmpegSettingsDefaults,
  type FfmpegSettings
} from "./export/ffmpeg/FfmpegSettings";
import { createExportProgress, IDLE_EXPORT_PROGRESS } from "./export/ExportProgress";
import {
  sanitizeOutputName,
  validateExportSettings,
  withExportSettingsDefaults
} from "./export/ExportSettings";
import type { ExportResult, ExportSettings } from "./export/ExportTypes";
import { exportPngSequenceZip } from "./export/SequenceExporter";
import { recordCapturedFramesWebM } from "./export/video/WebMRecorder";
import { createRenderJob } from "./export/renderQueue/RenderJob";
import {
  clearFinishedRenderJobs,
  enqueueRenderJob,
  removeRenderJob,
  replaceRenderJob
} from "./export/renderQueue/RenderQueue";
import { RenderJobRunner } from "./export/renderQueue/RenderJobRunner";
import { executeProductionRenderJob } from "./export/renderQueue/ProductionRenderExecutor";
import { HistoryStack } from "./history/HistoryStack";
import type { MinecraftWorldScan } from "./minecraft/import/MinecraftChunkTypes";
import {
  DEFAULT_WORLD_IMPORT_OPTIONS,
  WorldImportManager,
  type WorldChunkImportOptions
} from "./minecraft/import/WorldImportManager";
import {
  createWorldImportProgress,
  IDLE_WORLD_IMPORT_PROGRESS
} from "./minecraft/import/WorldImportProgress";
import { ResourcePackImporter } from "./minecraft/resources/ResourcePackImporter";
import type { MinecraftResourceSettings } from "./minecraft/resources/ResourcePackTypes";
import {
  addEnvironmentKeyframe,
  sampleEnvironmentProject
} from "./lighting/LightingController";
import { getLightingMoodPreset } from "./lighting/LightingPresets";
import type {
  LightingMoodPresetId,
  LightingSettings
} from "./lighting/LightingTypes";
import { pluginRegistry } from "./plugins/PluginRegistry";
import { applyCameraPreset } from "./presets/CameraPresets";
import { presetRegistry } from "./presets/PresetRegistry";
import { syncCinematicTimeline } from "./project/CinematicTimeline";
import { PackageReader } from "./project/package/PackageReader";
import { PackageWriter } from "./project/package/PackageWriter";
import type {
  CameraEntity,
  MineMotionProject,
  ProjectSettings,
  TimelineData,
  TransformData
} from "./project/ProjectFile";
import { ProjectSerializer } from "./project/ProjectSerializer";
import {
  hasProjectAutosave,
  loadProjectAutosave,
  saveProjectAutosave
} from "./project/ProjectAutosave";
import {
  createCharacter,
  createId,
  createInitialProject,
  createObjEntity,
  createSceneCamera,
  findObject,
  updateObjectLocked,
  updateObjectName,
  updateObjectTransform,
  updateObjectVisibility,
  updateProjectSettings
} from "./project/ProjectStore";
import {
  getPostProcessingPreset,
  POST_PROCESSING_PRESETS
} from "./rendering/postprocessing/PostProcessingPresets";
import type {
  PostProcessingPresetId,
  PostProcessingSettings
} from "./rendering/postprocessing/PostProcessingTypes";
import { renderViewportFrameToPng } from "./rendering/export/OfflineFrameRenderer";
import { createFinalCameraFrame } from "./rendering/export/FinalCameraRenderer";
import { sampleProjectAnimationWithVfxTiming } from "./vfx/runtime/VfxAnimationSampling";
import { LocalizationProvider } from "./localization/LocalizationContext";
import { createLocalizationService } from "./localization/LocalizationService";
import type { TranslationKey, TranslationValues } from "./localization/LocalizationTypes";
import {
  formatLocalizedDiagnostic,
  type LocalizationDiagnosticCode
} from "./localization/LocalizationDiagnostics";
import { localizeExportValidationMessage } from "./localization/LocalizationDomainMessages";
import { createRenderStateSnapshot } from "./rendering/export/RenderStateSnapshot";
import { restoreRenderState } from "./rendering/export/RenderStateRestore";
import { type SkyPresetId } from "./renderer/SkySystem";
import { Viewport } from "./renderer/Viewport";
import { BlockbenchImporter } from "./rigs/blockbench/BlockbenchImporter";
import { MinecraftSkinImporter } from "./rigs/MinecraftSkinImporter";
import { getSelectedCharacterId, parseRigBoneSelection } from "./rigs/RigSelection";
import { previewRigIKControls } from "./rigs/IK/RigIKController";
import { useRigIKSession } from "./rigs/IK/useRigIKSession";
import { useRigWorkspaceController } from "./rigs/RigWorkspaceController";
import { SettingsStore, type AppSettings } from "./settings/AppSettings";
import { templateRegistry } from "./templates/TemplateRegistry";
import { TopBar } from "./ui/TopBar";
import { EffectsLibraryPanel } from "./ui/effects/EffectsLibraryPanel";
import { ExportPanel } from "./ui/export/ExportPanel";
import { HelpPanel } from "./ui/help/HelpPanel";
import { InspectorPanel } from "./ui/inspector/InspectorPanel";
import { OutlinerPanel } from "./ui/outliner/OutlinerPanel";
import { PluginManagerPanel } from "./ui/plugins/PluginManagerPanel";
import { RigStudioPanel } from "./ui/rig/RigStudioPanel";
import { LightingStudioPanel } from "./ui/lighting/LightingStudioPanel";
import { SettingsModal } from "./ui/settings/SettingsModal";
import { TemplatePicker } from "./ui/templates/TemplatePicker";
import { TimelinePanel } from "./ui/timeline/TimelinePanel";
import { WorldImportPanel } from "./ui/world/WorldImportPanel";
import { VfxWorkspacePanel } from "./ui/vfx/VfxWorkspacePanel";

export function App() {
  const [settings, setSettings] = useState<AppSettings>(() =>
    SettingsStore.load()
  );
  const localization = useMemo(
    () =>
      createLocalizationService({
        preference: settings.general.language,
        pseudolocalization:
          typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("locale") === "qps-ploc",
        systemLanguages:
          typeof navigator === "undefined"
            ? []
            : [...navigator.languages, navigator.language]
      }),
    [settings.general.language]
  );
  const localizationRef = useRef(localization);
  localizationRef.current = localization;
  const tr = useCallback(
    (key: TranslationKey, values: TranslationValues = {}) =>
      localizationRef.current.t(key, values),
    []
  );
  const diagnostic = useCallback(
    (code: LocalizationDiagnosticCode, key: TranslationKey, values: TranslationValues = {}) =>
      formatLocalizedDiagnostic(localizationRef.current, code, key, values),
    []
  );
  const [project, setProjectState] = useState<MineMotionProject>(() =>
    createInitialProject(settings)
  );
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
    project.scene.characters[0]?.id ?? null
  );
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);
  const [status, setStatus] = useState(() => localization.t("app.ready"));
  const [isDirty, setIsDirty] = useState(false);
  const [lookThroughCameraRequest, setLookThroughCameraRequest] = useState(0);
  const [resetCameraRequest, setResetCameraRequest] = useState(0);
  const [focusWorldRequest, setFocusWorldRequest] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [pluginsOpen, setPluginsOpen] = useState(false);
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [rigStudioOpen, setRigStudioOpen] = useState(false);
  const [lightingStudioOpen, setLightingStudioOpen] = useState(false);
  const [worldImportOpen, setWorldImportOpen] = useState(false);
  const [vfxWorkspaceOpen, setVfxWorkspaceOpen] = useState(false);
  const [worldScan, setWorldScan] = useState<MinecraftWorldScan | null>(null);
  const [worldImportOptions, setWorldImportOptions] =
    useState<WorldChunkImportOptions>(DEFAULT_WORLD_IMPORT_OPTIONS);
  const [worldImportProgress, setWorldImportProgress] = useState(
    IDLE_WORLD_IMPORT_PROGRESS
  );
  const [exportProgress, setExportProgress] = useState(IDLE_EXPORT_PROGRESS);
  const [ffmpegDetection, setFfmpegDetection] =
    useState<FfmpegDetectionResult>(WEB_FFMPEG_STATUS);
  const [plugins, setPlugins] = useState(() => pluginRegistry.list());
  const [vfxPackageRegistry, setVfxPackageRegistry] =
    useState<VfxPackageRegistry>(() => createEmptyVfxPackageRegistry());

  const historyRef = useRef(new HistoryStack<MineMotionProject>());
  const projectRef = useRef(project);
  const setProject = useCallback(
    (
      updater:
        | MineMotionProject
        | ((currentProject: MineMotionProject) => MineMotionProject)
    ) => {
      const currentProject = projectRef.current;
      const nextProject =
        typeof updater === "function" ? updater(currentProject) : updater;
      projectRef.current = nextProject;
      setProjectState(nextProject);
    },
    []
  );
  const worldInputRef = useRef<HTMLInputElement | null>(null);
  const projectInputRef = useRef<HTMLInputElement | null>(null);
  const objInputRef = useRef<HTMLInputElement | null>(null);
  const skinInputRef = useRef<HTMLInputElement | null>(null);
  const skinTargetCharacterIdRef = useRef<string | null>(null);
  const blockbenchInputRef = useRef<HTMLInputElement | null>(null);
  const resourcePackZipInputRef = useRef<HTMLInputElement | null>(null);
  const resourcePackFolderInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const lastPlaybackTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    void loadVfxPackageRegistry(window.localStorage).then((loaded) => {
      if (cancelled) return;
      setVfxPackageRegistry(loaded.registry);
      if (loaded.warnings.length > 0) {
        setStatus(diagnostic("VFX_PACKAGE_REGISTRY_WARNING", "app.vfxRegistryWarnings", {
          count: loaded.warnings.length
        }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const previousAudioFrameRef = useRef(0);
  const exportCancelledRef = useRef(false);
  const renderJobRunnerRef = useRef(new RenderJobRunner());
  const worldImportCancelledRef = useRef(false);

  const presets = useMemo(() => presetRegistry.snapshot(), []);
  const rigPosePresets = useMemo(
    () => [...presets.rigPose, ...project.rigs.savedPoses],
    [presets.rigPose, project.rigs.savedPoses]
  );
  const templates = useMemo(() => templateRegistry.list(), []);
  const effectPresets = useMemo(() => builtinVfxPresetCatalog.list(), []);
  const selectedObject = useMemo(
    () => findObject(project, selectedObjectId)?.entity ?? null,
    [project, selectedObjectId]
  );
  const rigIKSession = useRigIKSession(project, selectedObjectId);

  useEffect(() => {
    if (
      selectedEffectId &&
      !project.effects.instances.some((effect) => effect.id === selectedEffectId)
    ) {
      setSelectedEffectId(null);
    }
  }, [project.effects.instances, selectedEffectId]);

  const animatedProject = useMemo(() => {
    const timelineFrame = project.animation.currentFrame;
    const sampled = sampleProjectAnimationWithVfxTiming(project, timelineFrame);
    return sampleEnvironmentProject(
      {
        ...sampled,
        animation: { ...sampled.animation, currentFrame: timelineFrame }
      },
      timelineFrame
    );
  }, [project]);
  const rigIKPreview = useMemo(
    () => previewRigIKControls(animatedProject, rigIKSession.characterId, rigIKSession.controls),
    [animatedProject, rigIKSession.characterId, rigIKSession.controls]
  );
  const displayProject = rigIKPreview.project;

  useEffect(() => {
    SettingsStore.save(settings);
    document.documentElement.style.setProperty(
      "--ui-scale",
      String(settings.editor.uiScale)
    );
  }, [settings]);

  useEffect(() => {
    if (!hasProjectAutosave(window.localStorage)) return;

    const shouldRestore = window.confirm(tr("app.confirmAutosave"));
    if (!shouldRestore) return;

    try {
      const recovered = loadProjectAutosave(window.localStorage);
      if (!recovered) return;
      const restored = recovered.project;
      setProject(restored);
      setSelectedObjectId(restored.scene.characters[0]?.id ?? null);
      setStatus(
        recovered.source === "backup"
          ? tr("app.autosaveBackupRestored")
          : tr("app.autosaveRestored")
      );
      setIsDirty(true);
    } catch (error) {
      setStatus(diagnostic("AUTOSAVE_RECOVERY_FAILED", "app.recoveryFailed"));
    }
  }, []);

  useEffect(() => {
    if (!settings.general.autosaveEnabled || !isDirty) return;

    const interval = window.setInterval(() => {
      try {
        saveProjectAutosave(window.localStorage, project);
        setStatus(tr("app.autosaved", { name: project.projectName }));
      } catch (error) {
        setStatus(diagnostic("AUTOSAVE_SAVE_FAILED", "app.autosaveFailed"));
      }
    }, settings.general.autosaveIntervalSeconds * 1000);

    return () => window.clearInterval(interval);
  }, [
    isDirty,
    project,
    settings.general.autosaveEnabled,
    settings.general.autosaveIntervalSeconds
  ]);

  useEffect(() => {
    audioManagerRef.current ??= new AudioManager();
    if (!project.animation.isPlaying) {
      previousAudioFrameRef.current = project.animation.currentFrame;
      return;
    }

    const previousFrame = previousAudioFrameRef.current;
    const currentFrame = project.animation.currentFrame;
    const clips = findClipsStartingAtFrame(
      project.audio.clips,
      currentFrame,
      previousFrame
    );
    for (const clip of clips) {
      audioManagerRef.current.playClip(clip);
    }
    previousAudioFrameRef.current = currentFrame;
  }, [
    project.animation.currentFrame,
    project.animation.isPlaying,
    project.audio.clips
  ]);

  useEffect(() => {
    if (!project.animation.isPlaying) {
      lastPlaybackTimeRef.current = null;
      return;
    }

    let animationFrame = 0;
    const tick = (time: number) => {
      setProject((currentProject) => {
        const lastTime = lastPlaybackTimeRef.current ?? time;
        lastPlaybackTimeRef.current = time;
        const elapsedSeconds = (time - lastTime) / 1000;
        const frameStep = elapsedSeconds * currentProject.animation.fps;
        const nextFrame = currentProject.animation.currentFrame + frameStep;
        const reachedEnd = nextFrame >= currentProject.animation.durationFrames;

        return {
          ...currentProject,
          animation: {
            ...currentProject.animation,
            currentFrame: reachedEnd
              ? currentProject.animation.durationFrames
              : Math.round(nextFrame),
            isPlaying: reachedEnd ? false : currentProject.animation.isPlaying
          }
        };
      });
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [project.animation.isPlaying]);

  const commitProject = useCallback(
    (
      updater: MineMotionProject | ((currentProject: MineMotionProject) => MineMotionProject),
      label: string
    ) => {
      const currentProject = projectRef.current;
      const nextProject =
        typeof updater === "function" ? updater(currentProject) : updater;
      if (nextProject === currentProject) return false;

      historyRef.current.push(currentProject, label);
      setProject(nextProject);
      setIsDirty(true);
      return true;
    },
    [setProject]
  );
  const rigWorkspace = useRigWorkspaceController({
    project,
    selectedObjectId,
    ikSession: rigIKSession,
    commitProject,
    setStatus,
    tr
  });

  const replaceProject = useCallback((nextProject: MineMotionProject, label: string) => {
    historyRef.current.clear();
    setProject(nextProject);
    setSelectedObjectId(nextProject.scene.characters[0]?.id ?? nextProject.scene.cameras[0]?.id ?? null);
    setSelectedEffectId(null);
    setIsDirty(true);
    setStatus(label);
  }, [setProject]);

  const confirmDiscardChanges = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm(tr("app.confirmDiscard"));
  }, [isDirty]);

  const handleSelectObject = useCallback((objectId: string | null) => {
    setSelectedObjectId(objectId);
    setSelectedEffectId(null);
  }, []);

  const handleSelectEffect = useCallback((effectId: string) => {
    setSelectedEffectId(effectId);
    setSelectedObjectId(null);
  }, []);

  const handleNewProject = useCallback(() => {
    if (!confirmDiscardChanges()) return;
    replaceProject(createInitialProject(settings), tr("app.newProject"));
  }, [confirmDiscardChanges, replaceProject, settings]);

  const handleNewProjectFromTemplate = useCallback(
    (templateId: string) => {
      if (!confirmDiscardChanges()) return;
      const nextProject = templateRegistry.createProject(templateId, settings);
      replaceProject(nextProject, tr("app.templateLoaded", { name: nextProject.projectName }));
      setTemplatesOpen(false);
    },
    [confirmDiscardChanges, replaceProject, settings]
  );

  const handleSaveProject = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const currentProject = projectRef.current;
    const filename = `${sanitizeOutputName(currentProject.projectName)}.minemotion`;
    downloadBlob(PackageWriter.write(currentProject), filename);

    setSettings((currentSettings) =>
      SettingsStore.addRecentProject(currentSettings, {
        id: filename,
        name: currentProject.projectName,
        savedAt: new Date().toISOString(),
        storageHint: "download"
      })
    );
    setIsDirty(false);
    setStatus(tr("app.projectSaved", { filename }));
  }, []);

  const handleExportLegacyProject = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const currentProject = projectRef.current;
    try {
      const raw = ProjectSerializer.serializeLegacyV9(currentProject);
      const blob = new Blob([raw], { type: "application/json" });
      const filename = `${sanitizeOutputName(currentProject.projectName)}.mmsproj`;
      downloadBlob(blob, filename);
      setStatus(tr("app.legacyExported", { filename }));
    } catch (error) {
      setStatus(diagnostic("PROJECT_SCHEMA9_VFX_UNSUPPORTED", "app.legacyVfxUnsupported"));
    }
  }, []);

  const handleLoadProject = useCallback(() => {
    projectInputRef.current?.click();
  }, []);

  const handleProjectFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !confirmDiscardChanges()) return;

    try {
      const raw = await file.text();
      const loadedProject = PackageReader.looksLikePackage(raw)
        ? PackageReader.parse(raw)
        : ProjectSerializer.parse(raw);
      historyRef.current.clear();
      setProject(loadedProject);
      setSelectedObjectId(
        loadedProject.scene.characters[0]?.id ??
          loadedProject.scene.cameras[0]?.id ??
          null
      );
      setSelectedEffectId(null);
      setIsDirty(false);
      setSettings((currentSettings) =>
        SettingsStore.addRecentProject(currentSettings, {
          id: file.name,
          name: loadedProject.projectName,
          savedAt: new Date().toISOString(),
          storageHint: "browser"
        })
      );
      setStatus(tr("app.projectLoaded", { name: loadedProject.projectName }));
    } catch (error) {
      setStatus(diagnostic("PROJECT_LOAD_FAILED", "app.projectLoadFailed"));
    }
  };

  const handleOpenWorld = useCallback(() => {
    setWorldImportOpen(true);
    worldInputRef.current?.click();
  }, []);

  const handleChooseWorldFolder = useCallback(() => {
    worldInputRef.current?.click();
  }, []);

  const handleWorldSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    event.target.value = "";
    if (!files || files.length === 0) return;

    try {
      setWorldImportProgress(
        createWorldImportProgress({
          status: "scanning",
          message: tr("app.worldScanning")
        })
      );
      const scan = await WorldImportManager.scan(files);
      const spawn = scan.level.spawn;
      const nextOptions: WorldChunkImportOptions = {
        ...worldImportOptions,
        centerChunkX: spawn ? Math.floor(spawn[0] / 16) : worldImportOptions.centerChunkX,
        centerChunkZ: spawn ? Math.floor(spawn[2] / 16) : worldImportOptions.centerChunkZ
      };
      const scannedWorld = WorldImportManager.createSummaryFromScan(
        scan,
        nextOptions
      );
      setWorldScan(scan);
      setWorldImportOptions(nextOptions);
      setWorldImportOpen(true);
      commitProject(
        (currentProject) =>
          updateProjectSettings(
            {
              ...currentProject,
              world: scannedWorld
            },
            {
              worldSourcePath: scannedWorld.sourcePath ?? scannedWorld.sourceName
            }
          ),
        "Scan world folder"
      );
      setSelectedObjectId("world");
      setWorldImportProgress(
        createWorldImportProgress({
          status: "complete",
          current: scan.dimensions.reduce(
            (sum, dimension) => sum + dimension.regionFiles.length,
            0
          ),
          total: scan.dimensions.reduce(
            (sum, dimension) => sum + dimension.regionFiles.length,
            0
          ),
          message: tr("app.worldScanned", { name: scan.sourceName })
        })
      );
      setStatus(
        tr("app.worldScanComplete", { name: scan.sourceName, dimensions: scan.dimensions
          .map((dimension) => `${dimension.label} ${dimension.regionFiles.length}`)
          .join(", ") })
      );
    } catch (error) {
      const message = diagnostic("WORLD_SCAN_FAILED", "app.worldScanFailed");
      setWorldImportProgress(
        createWorldImportProgress({
          status: "error",
          message,
          error: message
        })
      );
      setStatus(message);
    }
  };

  const handleWorldImportOptionsChange = useCallback(
    (options: WorldChunkImportOptions) => {
      setWorldImportOptions(options);
      setProject((currentProject) =>
        currentProject.world
          ? {
              ...currentProject,
              world: {
                ...currentProject.world,
                selectedDimension: options.dimension,
                importSettings: {
                  dimension: options.dimension,
                  centerChunkX: options.centerChunkX,
                  centerChunkZ: options.centerChunkZ,
                  radiusChunks: options.radiusChunks,
                  maxChunks: options.maxChunks,
                  maxRegionFiles: options.maxRegionFiles,
                  maxVerticalSections: options.maxVerticalSections
                },
                renderOptions: {
                  showChunkBorders: options.showChunkBorders,
                  showWorldOrigin: options.showWorldOrigin
                }
              }
            }
          : currentProject
      );
      if (project.world) {
        setIsDirty(true);
      }
    },
    [project.world]
  );

  const handleImportWorldChunks = useCallback(async () => {
    if (!worldScan) {
      setStatus(tr("app.chooseWorld"));
      return;
    }

    worldImportCancelledRef.current = false;
    setWorldImportProgress(
      createWorldImportProgress({
        status: "reading-regions",
        message: tr("app.worldPreparing")
      })
    );

    try {
      const result = await WorldImportManager.importChunks({
        scan: worldScan,
        importOptions: worldImportOptions,
        onProgress: setWorldImportProgress,
        isCancelled: () => worldImportCancelledRef.current
      });
      commitProject(
        (currentProject) =>
          updateProjectSettings(
            {
              ...currentProject,
              world: result.world,
              projectSettings: {
                ...currentProject.projectSettings,
                terrainPreset:
                  result.chunks.length > 0
                    ? "none"
                    : currentProject.projectSettings.terrainPreset
              }
            },
            {
              worldSourcePath: result.world.sourcePath ?? result.world.sourceName
            }
          ),
        "Import Minecraft chunks"
      );
      setSelectedObjectId("world");
      setFocusWorldRequest((value) => value + 1);
      setStatus(
        tr("app.worldImported", { chunks: result.chunks.length, blocks: result.estimate.importedBlocks, name: result.world.sourceName })
      );
    } catch (error) {
      const cancelled = worldImportCancelledRef.current;
      const message = diagnostic("WORLD_IMPORT_FAILED", "app.worldImportFailed");
      setWorldImportProgress(
        createWorldImportProgress({
          status: cancelled ? "cancelled" : "error",
          message,
          error: cancelled ? "" : message
        })
      );
      setStatus(message);
    }
  }, [commitProject, worldImportOptions, worldScan]);

  const handleCancelWorldImport = useCallback(() => {
    worldImportCancelledRef.current = true;
    setWorldImportProgress(
      createWorldImportProgress({
        status: "cancelled",
        message: tr("app.worldCancel")
      })
    );
    setStatus(tr("app.worldCancel"));
  }, []);

  const handleFocusWorld = useCallback(() => {
    setFocusWorldRequest((value) => value + 1);
    setStatus(tr("app.worldFocused"));
  }, []);

  const handleUnloadWorld = useCallback(() => {
    commitProject(
      (currentProject) =>
        updateProjectSettings(
          {
            ...currentProject,
            world: null
          },
          {
            worldSourcePath: "",
            terrainPreset: "demo"
          }
        ),
      "Unload Minecraft world"
    );
    setWorldScan(null);
    setSelectedObjectId(null);
    setStatus(tr("app.worldUnloaded"));
  }, [commitProject]);

  const handleAddCharacter = useCallback(() => {
    const character = createCharacter(
      `Character ${project.scene.characters.length + 1}`,
      [project.scene.characters.length * 1.5, 1.05, 0]
    );
    commitProject(
      (currentProject) => ({
        ...currentProject,
        scene: {
          ...currentProject.scene,
          characters: [...currentProject.scene.characters, character]
        }
      }),
      "Add character"
    );
    setSelectedObjectId(character.id);
    setStatus(tr("app.addedEntity", { name: character.name }));
  }, [commitProject, project.scene.characters.length]);

  const handleAddCamera = useCallback(() => {
    const camera = createSceneCamera(`Camera ${project.scene.cameras.length + 1}`);
    commitProject(
      (currentProject) => ({
        ...currentProject,
        scene: {
          ...currentProject.scene,
          cameras: [...currentProject.scene.cameras, camera]
        }
      }),
      "Add camera"
    );
    setSelectedObjectId(camera.id);
    setStatus(tr("app.addedEntity", { name: camera.name }));
  }, [commitProject, project.scene.cameras.length]);

  const handleImportObj = useCallback(() => {
    objInputRef.current?.click();
  }, []);

  const handleImportAudio = useCallback(() => {
    audioInputRef.current?.click();
  }, []);

  const handleObjSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const imported = await ObjImporter.fromFile(file);
      let createdObjectId = "";
      commitProject(
        (currentProject) => {
          const { project: withAsset, asset } = AssetManager.addObjAsset(
            currentProject,
            imported.name,
            imported.rawObj
          );
          const entity = createObjEntity(asset.id, imported.name);
          createdObjectId = entity.id;
          return {
            ...withAsset,
            scene: {
              ...withAsset.scene,
              importedObjects: [...withAsset.scene.importedObjects, entity]
            }
          };
        },
        "Import OBJ"
      );
      setSelectedObjectId(createdObjectId);
      setStatus(
        imported.warnings.length
          ? tr("app.objImportedWarnings", { name: imported.name, count: imported.warnings.length })
          : tr("app.objImported", { name: imported.name })
      );
    } catch (error) {
      setStatus(diagnostic("OBJ_IMPORT_FAILED", "app.objFailed"));
    }
  };

  const handleImportSkin = useCallback((characterId: string) => {
    skinTargetCharacterIdRef.current = characterId;
    skinInputRef.current?.click();
  }, []);

  const handleSkinSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const targetCharacterId =
      skinTargetCharacterIdRef.current ?? getSelectedCharacterId(selectedObjectId);
    skinTargetCharacterIdRef.current = null;
    if (!targetCharacterId) {
      setStatus(tr("app.selectCharacterSkin"));
      return;
    }

    try {
      const skin = await MinecraftSkinImporter.fromFile(file);
      commitProject(
        (currentProject) => {
          const withSkinAsset = AssetManager.addSkinAsset(currentProject, skin);
          return {
            ...withSkinAsset,
            scene: {
              ...withSkinAsset.scene,
              characters: withSkinAsset.scene.characters.map((character) =>
                character.id === targetCharacterId
                  ? {
                      ...character,
                      skin,
                      modelType:
                        skin.metadata.modelType === "unknown"
                          ? character.modelType
                          : skin.metadata.modelType
                    }
                  : character
              )
            }
          };
        },
        "Import Minecraft skin"
      );
      setSelectedObjectId(targetCharacterId);
      setStatus(
        skin.metadata.valid
          ? tr("app.skinImported", { name: skin.name, width: skin.metadata.width, height: skin.metadata.height, model: skin.metadata.modelType })
          : tr("app.skinInvalid", { name: skin.name })
      );
    } catch (error) {
      setStatus(diagnostic("SKIN_IMPORT_FAILED", "app.skinFailed"));
    }
  };

  const handleResetSkin = useCallback(
    (characterId: string) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          scene: {
            ...currentProject.scene,
            characters: currentProject.scene.characters.map((character) =>
              character.id === characterId ? { ...character, skin: null } : character
            )
          }
        }),
        "Reset character skin"
      );
      setStatus(tr("app.skinReset"));
    },
    [commitProject]
  );

  const handleImportBlockbench = useCallback(() => {
    blockbenchInputRef.current?.click();
  }, []);

  const handleBlockbenchSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const imported = await BlockbenchImporter.fromFile(file);
      let createdObjectId = "";
      commitProject(
        (currentProject) => {
          const withBlockbenchAsset = AssetManager.addBlockbenchAsset(
            currentProject,
            imported.asset
          );
          const { project: withObjAsset, asset } = AssetManager.addObjAsset(
            withBlockbenchAsset,
            imported.asset.name,
            imported.rawObj
          );
          const entity = createObjEntity(asset.id, imported.asset.name);
          createdObjectId = entity.id;
          return {
            ...withObjAsset,
            scene: {
              ...withObjAsset.scene,
              importedObjects: [...withObjAsset.scene.importedObjects, entity]
            }
          };
        },
        "Import Blockbench model"
      );
      setSelectedObjectId(createdObjectId);
      setRigStudioOpen(true);
      setStatus(
        tr("app.blockbenchImported", { name: imported.asset.name, cubes: imported.asset.elementCount, groups: imported.asset.groupCount })
      );
    } catch (error) {
      setStatus(diagnostic("BLOCKBENCH_IMPORT_FAILED", "app.blockbenchFailed"));
    }
  };

  const handleUpdateTransform = useCallback(
    (objectId: string, transform: TransformData) => {
      const lookup = findObject(project, objectId);
      if (lookup?.entity.locked) {
        setStatus(tr("app.entityLocked", { name: lookup.entity.name }));
        return;
      }
      commitProject(
        (currentProject) =>
          updateObjectTransform(currentProject, objectId, transform),
        "Change transform"
      );
    },
    [commitProject, project]
  );

  const handleAddEffect = useCallback(
    (type: EffectType) => {
      const currentProject = projectRef.current;
      const startFrame = currentProject.animation.currentFrame;
      const remainingFrames =
        currentProject.animation.durationFrames - startFrame;
      if (remainingFrames < 1) {
        setStatus(tr("app.effectFinalFrame"));
        return;
      }
      const spawnedEffect = spawnEffectAtFrame(
        type,
        startFrame,
        selectedObjectId ?? ""
      );
      const effect = {
        ...spawnedEffect,
        durationFrames: Math.min(
          spawnedEffect.durationFrames,
          remainingFrames
        )
      };
      const result = applyEffectTimelineCommand(projectRef.current, {
        type: "insert",
        effect
      });
      if (!result.ok) {
        setStatus(diagnostic("EFFECT_ADD_FAILED", "app.effectAddFailed"));
        return;
      }
      if (result.value.changed) {
        commitProject(result.value.project, result.value.historyLabel);
      }
      setSelectedEffectId(result.value.selectedEffectId);
      setSelectedObjectId(null);
      setStatus(tr("app.effectAdded", { name: effect.name, frame: effect.startFrame }));
    },
    [commitProject, selectedObjectId]
  );

  const handleAddCustomEffect = useCallback(
    (packageId: string) => {
      const entry = vfxPackageRegistry.packages.find(
        (candidate) => candidate.id === packageId && candidate.enabled
      );
      if (!entry) {
        setStatus(tr("app.customVfxUnavailable", { id: packageId }));
        return;
      }
      const currentProject = projectRef.current;
      const startFrame = currentProject.animation.currentFrame;
      const remainingFrames = currentProject.animation.durationFrames - startFrame;
      if (remainingFrames < 1) {
        setStatus(tr("app.effectFinalFrame"));
        return;
      }
      try {
        const created = createInstalledVfxEffect(entry, {
          id: createId("effect"),
          startFrame,
          targetObjectId: selectedObjectId ?? undefined
        });
        const effect = {
          ...created,
          durationFrames: Math.min(created.durationFrames, remainingFrames)
        };
        const result = applyEffectTimelineCommand(currentProject, {
          type: "insert",
          effect
        });
        if (!result.ok) {
          setStatus(diagnostic("VFX_ADD_FAILED", "app.customVfxAddFailed"));
          return;
        }
        if (result.value.changed) commitProject(result.value.project, result.value.historyLabel);
        setSelectedEffectId(result.value.selectedEffectId);
        setSelectedObjectId(null);
        setStatus(tr("app.customVfxAdded", { name: effect.name, frame: effect.startFrame }));
      } catch (error) {
        setStatus(diagnostic("VFX_ADD_FAILED", "app.customVfxAddFailed"));
      }
    },
    [commitProject, selectedObjectId, vfxPackageRegistry]
  );

  const customVfxPresets = useMemo(
    () => listEnabledInstalledVfxPresets(vfxPackageRegistry, localization.language),
    [localization.language, vfxPackageRegistry]
  );

  const handleEffectTimelineCommand = useCallback(
    (command: EffectTimelineCommand) => {
      const result = applyEffectTimelineCommand(projectRef.current, command);
      if (!result.ok) {
        const message = diagnostic("EFFECT_EDIT_FAILED", "app.effectEditFailed");
        setStatus(message);
        return message;
      }
      if (!result.value.changed) {
        setStatus(tr("app.effectUnchanged"));
        return null;
      }

      commitProject(result.value.project, result.value.historyLabel);
      setSelectedEffectId(result.value.selectedEffectId);
      if (result.value.selectedEffectId) setSelectedObjectId(null);
      setStatus(`${result.value.historyLabel}.`);
      return null;
    },
    [commitProject]
  );

  const handleUpdateEffect = useCallback(
    (effectId: string, patch: EffectTimelineEditablePatch) => {
      return handleEffectTimelineCommand({ type: "update", effectId, patch });
    },
    [handleEffectTimelineCommand]
  );

  const handleDeleteEffect = useCallback(
    (effectId: string) => {
      handleEffectTimelineCommand({ type: "delete", effectId });
    },
    [handleEffectTimelineCommand]
  );

  const handleApplyPostPreset = useCallback(
    (presetId: PostProcessingPresetId) => {
      const preset = getPostProcessingPreset(presetId);
      commitProject(
        (currentProject) => ({
          ...currentProject,
          postProcessing: preset.settings
        }),
        "Apply post-processing preset"
      );
      setStatus(tr("app.postPreset", { name: preset.name }));
    },
    [commitProject]
  );

  const handleUpdatePostProcessing = useCallback(
    (postSettings: Partial<PostProcessingSettings>) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          postProcessing: {
            ...currentProject.postProcessing,
            ...postSettings
          }
        }),
        "Edit post-processing"
      );
      setStatus(tr("app.postUpdated"));
    },
    [commitProject]
  );

  const handleToggleRenderPreview = useCallback(() => {
    commitProject(
      (currentProject) => ({
        ...currentProject,
        renderSettings: {
          ...currentProject.renderSettings,
          renderPreviewEnabled:
            !currentProject.renderSettings.renderPreviewEnabled
        }
      }),
      "Toggle render preview"
    );
    setStatus(tr("app.previewToggled"));
  }, [commitProject]);

  const handleToggleCinematicBars = useCallback(() => {
    commitProject(
      (currentProject) => ({
        ...currentProject,
        renderSettings: {
          ...currentProject.renderSettings,
          cinematicBarsEnabled:
            !currentProject.renderSettings.cinematicBarsEnabled
        }
      }),
      "Toggle cinematic bars"
    );
    setStatus(tr("app.barsToggled"));
  }, [commitProject]);

  const handleExportSettingsChange = useCallback((settings: ExportSettings) => {
    setProject((currentProject) => ({
      ...currentProject,
      exportSettings: withExportSettingsDefaults(settings, currentProject)
    }));
    setIsDirty(true);
  }, []);

  const handleFfmpegSettingsChange = useCallback(
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
      setIsDirty(true);
    },
    [ffmpegDetection.nativeRuntime, project.ffmpegSettings.executablePath]
  );

  const handleDetectFfmpeg = useCallback(async () => {
    setStatus(tr("app.ffmpegDetecting"));
    const result = await detectFfmpeg(project.ffmpegSettings);
    setFfmpegDetection(result);
    setStatus(result.message);
  }, [project.ffmpegSettings]);

  const handleAddRenderJob = useCallback(() => {
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
    setIsDirty(true);
    setStatus(tr("app.jobAdded", { name: job.name }));
  }, [ffmpegDetection.available, project]);

  const handleRemoveRenderJob = useCallback((jobId: string) => {
    setProject((currentProject) => ({
      ...currentProject,
      renderQueue: removeRenderJob(currentProject.renderQueue, jobId)
    }));
    setIsDirty(true);
  }, []);

  const handleClearFinishedRenderJobs = useCallback(() => {
    setProject((currentProject) => ({
      ...currentProject,
      renderQueue: clearFinishedRenderJobs(currentProject.renderQueue)
    }));
    setIsDirty(true);
  }, []);

  const handleRunRenderJob = useCallback(
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

      exportCancelledRef.current = false;
      const snapshot = createRenderStateSnapshot(project);
      const viewportShell = getViewportShell();
      const totalFrames = Math.max(
        1,
        job.settings.endFrame - job.settings.startFrame + 1
      );
      const renderProject = {
        ...project,
        exportSettings: job.settings
      };
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

      const runner = renderJobRunnerRef.current;
      try {
        const finalJob = await runner.run(
          job,
          async (context) =>
            await executeProductionRenderJob({
              job,
              project: renderProject,
              ffmpegSettings: project.ffmpegSettings,
              context,
              adapters: {
                captureFrame,
                download: downloadBlob
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
            const progressStatus =
              updatedJob.status === "complete"
                ? "complete"
                : updatedJob.status === "cancelled"
                  ? "cancelled"
                  : updatedJob.status === "error"
                    ? "error"
                    : updatedJob.progress >= 0.85
                      ? "encoding"
                      : "rendering";
            setExportProgress(
              createExportProgress({
                status: progressStatus,
                currentFrame: Math.round(updatedJob.progress * totalFrames),
                totalFrames,
                message: updatedJob.message,
                error: updatedJob.error
              })
            );
          }
        );
        setStatus(finalJob.message);
      } finally {
        setProject((currentProject) =>
          restoreRenderState(currentProject, snapshot)
        );
        setIsDirty(true);
      }
    },
    [ffmpegDetection.available, project]
  );

  const validateCurrentExport = useCallback(() => {
    const validation = validateExportSettings(project.exportSettings, project);
    if (!validation.valid) {
      const message = validation.errors
        .map((entry) => localizeExportValidationMessage(localizationRef.current, entry))
        .join(" ");
      setStatus(message);
      setExportProgress(
        createExportProgress({
          status: "error",
          message: diagnostic("EXPORT_SETTINGS_INVALID", "app.exportInvalid"),
          error: message
        })
      );
      return false;
    }
    if (validation.warnings.length > 0) {
      setStatus(validation.warnings
        .map((entry) => localizeExportValidationMessage(localizationRef.current, entry))
        .join(" "));
    }
    return true;
  }, [project]);

  const handleExportCurrentFrame = useCallback(async () => {
    if (!validateCurrentExport()) return;
    exportCancelledRef.current = false;
    const snapshot = createRenderStateSnapshot(project);
    const settings = project.exportSettings;
    setExportProgress(
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
      setExportProgress(
        createExportProgress({
          status: "complete",
          currentFrame: 1,
          totalFrames: 1,
          message: tr("app.exported", { filename: result.filename })
        })
      );
      setStatus(tr("app.exported", { filename: result.filename }));
    } catch (error) {
      const message = diagnostic("EXPORT_PNG_FAILED", "app.pngFailed");
      setExportProgress(
        createExportProgress({
          status: "error",
          message,
          error: message
        })
      );
      setStatus(message);
    } finally {
      setProject((currentProject) => restoreRenderState(currentProject, snapshot));
    }
  }, [project, validateCurrentExport]);

  const handleExportSequence = useCallback(async () => {
    if (!validateCurrentExport()) return;
    exportCancelledRef.current = false;
    const snapshot = createRenderStateSnapshot(project);
    const settings = project.exportSettings;
    setExportProgress(
      createExportProgress({
        status: "preparing",
        message: tr("app.sequencePreparing")
      })
    );

    try {
      const viewportShell = getViewportShell();
      const result = await exportPngSequenceZip({
        settings,
        onProgress: setExportProgress,
        isCancelled: () => exportCancelledRef.current,
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
      setExportProgress(
        createExportProgress({
          status: "complete",
          currentFrame: settings.endFrame - settings.startFrame + 1,
          totalFrames: settings.endFrame - settings.startFrame + 1,
          message: tr("app.exported", { filename: result.filename })
        })
      );
      setStatus(tr("app.exported", { filename: result.filename }));
    } catch (error) {
      const message = diagnostic("EXPORT_SEQUENCE_FAILED", "app.sequenceFailed");
      setExportProgress(
        createExportProgress({
          status: exportCancelledRef.current ? "cancelled" : "error",
          message,
          error: exportCancelledRef.current ? "" : message
        })
      );
      setStatus(message);
    } finally {
      setProject((currentProject) => restoreRenderState(currentProject, snapshot));
    }
  }, [project, validateCurrentExport]);

  const handleExportWebM = useCallback(async () => {
    if (!validateCurrentExport()) return;
    exportCancelledRef.current = false;
    const settings = project.exportSettings;
    const snapshot = createRenderStateSnapshot(project);
    const totalFrames = settings.endFrame - settings.startFrame + 1;
    setExportProgress(
      createExportProgress({
        status: "preparing",
        totalFrames,
        message: tr("app.webmRecording")
      })
    );

    try {
      const viewportShell = getViewportShell();
      const blob = await recordCapturedFramesWebM({
        startFrame: settings.startFrame,
        endFrame: settings.endFrame,
        fps: settings.fps,
        width: settings.width,
        height: settings.height,
        quality: settings.quality,
        isCancelled: () => exportCancelledRef.current,
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
          setExportProgress(
            createExportProgress({
              status: "rendering",
              currentFrame: index,
              totalFrames,
              message: tr("app.recordingFrame", { frame: index, total: totalFrames })
            })
          );
        }
      });
      const filename = `${sanitizeOutputName(settings.outputName)}.webm`;
      downloadBlob(blob, filename);
      setExportProgress(
        createExportProgress({
          status: "complete",
          currentFrame: totalFrames,
          totalFrames,
          message: tr("app.exported", { filename })
        })
      );
      setStatus(tr("app.exportedSize", { filename, width: settings.width, height: settings.height }));
    } catch (error) {
      const message = diagnostic("EXPORT_WEBM_FAILED", "app.webmFailed");
      setExportProgress(
        createExportProgress({
          status: exportCancelledRef.current ? "cancelled" : "error",
          message,
          error: exportCancelledRef.current ? "" : message
        })
      );
      setStatus(message);
    } finally {
      setProject((currentProject) => restoreRenderState(currentProject, snapshot));
    }
  }, [project, validateCurrentExport]);

  const handleExportWav = useCallback(async () => {
    exportCancelledRef.current = false;
    setExportProgress(
      createExportProgress({
        status: "encoding",
        message: tr("app.wavMixing")
      })
    );

    try {
      const blob = await exportProjectWav(project, {
        startFrame: project.exportSettings.startFrame,
        endFrame: project.exportSettings.endFrame
      });
      const filename = `${sanitizeOutputName(project.exportSettings.outputName)}.wav`;
      downloadBlob(blob, filename);
      setExportProgress(
        createExportProgress({
          status: "complete",
          currentFrame: 1,
          totalFrames: 1,
          message: tr("app.exported", { filename })
        })
      );
      setStatus(tr("app.exported", { filename }));
    } catch (error) {
      const message = diagnostic("EXPORT_WAV_FAILED", "app.wavFailed");
      setExportProgress(
        createExportProgress({
          status: "error",
          message,
          error: message
        })
      );
      setStatus(message);
    }
  }, [project]);

  const handleCancelExport = useCallback(() => {
    exportCancelledRef.current = true;
    renderJobRunnerRef.current.cancel();
    setExportProgress(
      createExportProgress({
        status: "cancelled",
        message: tr("app.exportCancel")
      })
    );
    setStatus(tr("app.exportCancel"));
  }, []);

  const handleAudioSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setStatus(tr("app.sfxUnsupported"));
      return;
    }

    try {
      const clip = await createImportedAudioClip(
        file,
        project.animation.currentFrame
      );
      commitProject(
        (currentProject) =>
          syncCinematicTimeline({
            ...currentProject,
            audio: {
              clips: [...currentProject.audio.clips, clip]
            }
          }),
        "Import SFX"
      );
      setStatus(tr("app.sfxImported", { name: clip.name }));
    } catch (error) {
      setStatus(diagnostic("AUDIO_IMPORT_FAILED", "app.sfxFailed"));
    }
  };

  const handleAddBuiltinSfx = useCallback(
    (sfxId: string) => {
      const sfx = getBuiltinSfx(sfxId);
      if (!sfx) return;
      const clip = createBuiltinAudioClip(sfx, project.animation.currentFrame);
      commitProject(
        (currentProject) =>
          syncCinematicTimeline({
            ...currentProject,
            audio: {
              clips: [...currentProject.audio.clips, clip]
            }
          }),
        "Add builtin SFX"
      );
      setStatus(tr("app.sfxAdded", { name: clip.name }));
    },
    [commitProject, project.animation.currentFrame]
  );

  const handleRenameObject = useCallback(
    (objectId: string, name: string) => {
      commitProject(
        (currentProject) => updateObjectName(currentProject, objectId, name),
        "Rename object"
      );
    },
    [commitProject]
  );

  const handleToggleVisibility = useCallback(
    (objectId: string, visible: boolean) => {
      commitProject(
        (currentProject) =>
          updateObjectVisibility(currentProject, objectId, visible),
        "Toggle object visibility"
      );
    },
    [commitProject]
  );

  const handleToggleLocked = useCallback(
    (objectId: string, locked: boolean) => {
      commitProject(
        (currentProject) => updateObjectLocked(currentProject, objectId, locked),
        "Toggle object lock"
      );
    },
    [commitProject]
  );

  const handleDuplicateSelectedObject = useCallback(() => {
    if (!selectedObjectId) return;
    const lookup = findObject(project, selectedObjectId);
    if (!lookup) {
      setStatus(tr("app.selectDuplicate"));
      return;
    }
    if (lookup.entity.locked) {
      setStatus(tr("app.entityLocked", { name: lookup.entity.name }));
      return;
    }

    const duplicate = structuredClone(lookup.entity) as typeof lookup.entity;
    duplicate.id = createId(duplicate.type);
    duplicate.name = `${duplicate.name} Copy`;
    duplicate.transform.position = [
      duplicate.transform.position[0] + 1,
      duplicate.transform.position[1],
      duplicate.transform.position[2] + 1
    ];
    duplicate.metadata = {
      ...duplicate.metadata,
      duplicatedFrom: lookup.entity.id
    };
    if (duplicate.type === "camera") {
      (duplicate as CameraEntity).active = false;
    }

    commitProject(
      (currentProject) => ({
        ...currentProject,
        scene: {
          ...currentProject.scene,
          [lookup.collection]: [
            ...currentProject.scene[lookup.collection],
            duplicate
          ]
        }
      }),
      "Duplicate object"
    );
    setSelectedObjectId(duplicate.id);
    setSelectedEffectId(null);
    setStatus(tr("app.duplicated", { name: lookup.entity.name }));
  }, [commitProject, project, selectedObjectId]);

  const handleDeleteSelectedObject = useCallback(() => {
    if (!selectedObjectId) return;
    const lookup = findObject(project, selectedObjectId);
    if (!lookup) {
      setStatus(tr("app.selectDelete"));
      return;
    }
    if (lookup.entity.locked) {
      setStatus(tr("app.entityLocked", { name: lookup.entity.name }));
      return;
    }

    commitProject(
      (currentProject) => {
        const nextCollection = currentProject.scene[lookup.collection].filter(
          (entity) => entity.id !== selectedObjectId
        );
        const nextProject = {
          ...currentProject,
          scene: {
            ...currentProject.scene,
            [lookup.collection]: nextCollection
          }
        };
        if (
          lookup.collection === "cameras" &&
          currentProject.activeCameraId === selectedObjectId
        ) {
          const nextCamera = nextProject.scene.cameras[0];
          return {
            ...nextProject,
            activeCameraId: nextCamera?.id ?? "",
            scene: {
              ...nextProject.scene,
              cameras: nextProject.scene.cameras.map((camera, index) => ({
                ...camera,
                active: index === 0
              }))
            }
          };
        }
        return nextProject;
      },
      "Delete object"
    );
    setSelectedObjectId(null);
    setStatus(tr("app.deleted", { name: lookup.entity.name }));
  }, [commitProject, project, selectedObjectId]);

  const handleAddKeyframe = useCallback(() => {
    const boneSelection = parseRigBoneSelection(selectedObjectId);
    if (boneSelection) {
      rigWorkspace.addBoneKeyframe(boneSelection.characterId, boneSelection.boneId);
      return;
    }

    if (!selectedObjectId || selectedObjectId === "world") {
      setStatus(tr("app.selectKeyframe"));
      return;
    }

    const lookup = findObject(project, selectedObjectId);
    if (!lookup) {
      setStatus(tr("app.notKeyframeable"));
      return;
    }

    commitProject(
      (currentProject) =>
        addTransformKeyframes(
          currentProject,
          selectedObjectId,
          currentProject.animation.currentFrame
        ),
      "Add keyframe"
    );
    setStatus(
      tr("app.transformKey", { name: lookup.entity.name, frame: project.animation.currentFrame })
    );
  }, [commitProject, project, rigWorkspace.addBoneKeyframe, selectedObjectId]);

  const handleSkyChange = useCallback(
    (preset: SkyPresetId, customColor: string) => {
      commitProject(
        (currentProject) =>
          updateProjectSettings(
            {
              ...currentProject,
              sky: {
                preset,
                customColor
              }
            },
            {
              defaultSkyPreset: preset
            }
          ),
        "Change sky"
      );
      setStatus(tr("app.skyChanged", { preset }));
    },
    [commitProject]
  );

  const handleApplyLightingMood = useCallback(
    (presetId: LightingMoodPresetId) => {
      const preset = getLightingMoodPreset(presetId);
      const postPreset = getPostProcessingPreset(preset.postPresetId);
      commitProject(
        (currentProject) => ({
          ...currentProject,
          projectSettings: {
            ...currentProject.projectSettings,
            defaultSkyPreset: preset.skyPresetId
          },
          sky: {
            ...currentProject.sky,
            preset: preset.skyPresetId
          },
          lighting: {
            ...preset.settings,
            sunDirection: [...preset.settings.sunDirection],
            keyframes: currentProject.lighting.keyframes
          },
          postProcessing: {
            ...postPreset.settings
          }
        }),
        "Apply lighting mood"
      );
      setStatus(tr("app.lightingMood", { name: preset.name }));
    },
    [commitProject]
  );

  const handleUpdateLighting = useCallback(
    (patch: Partial<LightingSettings>) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          lighting: {
            ...currentProject.lighting,
            ...patch
          }
        }),
        "Edit lighting"
      );
      setStatus(tr("app.lightingUpdated"));
    },
    [commitProject]
  );

  const handleUpdateMinecraftResources = useCallback(
    (minecraftResources: MinecraftResourceSettings) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          minecraftResources
        }),
        "Edit Minecraft materials"
      );
      setStatus(tr("app.materialsUpdated"));
    },
    [commitProject]
  );

  const handleChooseResourcePackZip = useCallback(() => {
    resourcePackZipInputRef.current?.click();
  }, []);

  const handleChooseResourcePackFolder = useCallback(() => {
    resourcePackFolderInputRef.current?.click();
  }, []);

  const handleResourcePackZipSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const pack = await ResourcePackImporter.importZip(file);
      commitProject(
        (currentProject) => ({
          ...currentProject,
          assets: {
            ...currentProject.assets,
            resourcePacks: [...currentProject.assets.resourcePacks, pack]
          },
          minecraftResources: {
            ...currentProject.minecraftResources,
            activeResourcePackId: pack.id
          }
        }),
        "Import resource pack ZIP"
      );
      setLightingStudioOpen(true);
      setStatus(
        tr("app.resourcePackImported", { name: pack.name, count: pack.textures.length })
      );
    } catch (error) {
      setStatus(diagnostic("RESOURCE_PACK_ZIP_FAILED", "app.resourceZipFailed"));
    }
  };

  const handleResourcePackFolderSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    event.target.value = "";
    if (!files || files.length === 0) return;
    try {
      const pack = await ResourcePackImporter.importFolder(files);
      commitProject(
        (currentProject) => ({
          ...currentProject,
          assets: {
            ...currentProject.assets,
            resourcePacks: [...currentProject.assets.resourcePacks, pack]
          },
          minecraftResources: {
            ...currentProject.minecraftResources,
            activeResourcePackId: pack.id
          }
        }),
        "Import resource pack folder"
      );
      setLightingStudioOpen(true);
      setStatus(
        tr("app.resourcePackImported", { name: pack.name, count: pack.textures.length })
      );
    } catch (error) {
      setStatus(diagnostic("RESOURCE_PACK_FOLDER_FAILED", "app.resourceFolderFailed"));
    }
  };

  const handleSetActiveResourcePack = useCallback(
    (packId: string | null) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          minecraftResources: {
            ...currentProject.minecraftResources,
            activeResourcePackId: packId
          }
        }),
        "Change active resource pack"
      );
      setStatus(tr(packId ? "app.resourceApplied" : "app.resourceReset"));
    },
    [commitProject]
  );

  const handleRemoveResourcePack = useCallback(
    (packId: string) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          assets: {
            ...currentProject.assets,
            resourcePacks: currentProject.assets.resourcePacks.filter(
              (pack) => pack.id !== packId
            )
          },
          minecraftResources: {
            ...currentProject.minecraftResources,
            activeResourcePackId:
              currentProject.minecraftResources.activeResourcePackId === packId
                ? null
                : currentProject.minecraftResources.activeResourcePackId
          }
        }),
        "Remove resource pack"
      );
      setStatus(tr("app.resourceRemoved"));
    },
    [commitProject]
  );

  const handleAddEnvironmentKeyframe = useCallback(() => {
    commitProject(
      (currentProject) =>
        syncCinematicTimeline({
          ...currentProject,
          lighting: addEnvironmentKeyframe(
            currentProject.lighting,
            currentProject.postProcessing,
            currentProject.animation.currentFrame
          )
        }),
      "Add environment keyframe"
    );
    setStatus(
      tr("app.environmentKey", { frame: project.animation.currentFrame })
    );
  }, [commitProject, project.animation.currentFrame]);

  const handleProjectSettingsChange = useCallback(
    (projectSettings: ProjectSettings) => {
      commitProject(
        (currentProject) => updateProjectSettings(currentProject, projectSettings),
        "Change project settings"
      );
      setStatus(tr("app.projectSettingsUpdated"));
    },
    [commitProject]
  );

  const handleSetFrame = useCallback((frame: number) => {
    setProject((currentProject) => ({
      ...currentProject,
      animation: setCurrentFrame(currentProject.animation, frame)
    }));
  }, []);

  const handleUpdateAnimation = useCallback(
    (animation: TimelineData, label: string) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          animation
        }),
        label
      );
      setStatus(`${label}.`);
    },
    [commitProject]
  );

  const handleSetFps = useCallback(
    (fps: number) => {
      const safeFps = Math.min(120, Math.max(1, Math.round(fps || 1)));
      commitProject(
        (currentProject) =>
          updateProjectSettings(currentProject, {
            fps: safeFps
          }),
        "Change FPS"
      );
    },
    [commitProject]
  );

  const handleTogglePlayback = useCallback(() => {
    setProject((currentProject) => ({
      ...currentProject,
      animation: {
        ...currentProject.animation,
        currentFrame:
          currentProject.animation.currentFrame >=
          currentProject.animation.durationFrames
            ? 0
            : currentProject.animation.currentFrame,
        isPlaying: !currentProject.animation.isPlaying
      }
    }));
  }, []);

  const handleLookThroughCamera = useCallback(() => {
    if (findObject(project, selectedObjectId)?.entity.type !== "camera") {
      setStatus(tr("app.selectCamera"));
      return;
    }
    setLookThroughCameraRequest((value) => value + 1);
    setStatus(tr("app.cameraMoved"));
  }, [project, selectedObjectId]);

  const handleResetViewportCamera = useCallback(() => {
    setResetCameraRequest((value) => value + 1);
    setStatus(tr("app.cameraReset"));
  }, []);

  const handleApplyCameraPreset = useCallback(
    (presetId: string) => {
      if (!selectedObjectId) return;
      const preset = presetRegistry.getCameraPreset(presetId);
      if (!preset) return;
      commitProject(
        (currentProject) => ({
          ...currentProject,
          scene: {
            ...currentProject.scene,
            cameras: currentProject.scene.cameras.map((camera) =>
              camera.id === selectedObjectId
                ? applyCameraPreset(camera, preset)
                : camera
            )
          }
        }),
        "Apply camera preset"
      );
      setStatus(tr("app.cameraPreset", { name: preset.name }));
    },
    [commitProject, selectedObjectId]
  );

  const handleUndo = useCallback(() => {
    const previousProject = historyRef.current.undo(projectRef.current);
    if (!previousProject) {
      setStatus(tr("app.nothingUndo"));
      return;
    }
    setProject(previousProject);
    setIsDirty(true);
    setStatus(tr("app.undo"));
  }, [setProject]);

  const handleRedo = useCallback(() => {
    const nextProject = historyRef.current.redo(projectRef.current);
    if (!nextProject) {
      setStatus(tr("app.nothingRedo"));
      return;
    }
    setProject(nextProject);
    setIsDirty(true);
    setStatus(tr("app.redo"));
  }, [setProject]);

  const handleTogglePlugin = useCallback(
    (pluginId: string, enabled: boolean) => {
      pluginRegistry.setEnabled(pluginId, enabled);
      setPlugins(pluginRegistry.list());
      setSettings((currentSettings) => ({
        ...currentSettings,
        plugins: {
          ...currentSettings.plugins,
          disabledPluginIds: enabled
            ? currentSettings.plugins.disabledPluginIds.filter(
                (id) => id !== pluginId
              )
            : [...new Set([...currentSettings.plugins.disabledPluginIds, pluginId])]
        }
      }));
      setStatus(tr("app.pluginState", { state: tr(enabled ? "common.enabled" : "common.disabled"), id: pluginId }));
    },
    []
  );

  const handleLoadSampleScene = useCallback(() => {
    handleNewProjectFromTemplate("sunset-showcase");
    setHelpOpen(false);
  }, [handleNewProjectFromTemplate]);

  const commands = useMemo(
    () =>
      createBuiltinCommands({
        newProject: handleNewProject,
        saveProject: handleSaveProject,
        loadProject: handleLoadProject,
        addCharacter: handleAddCharacter,
        addCamera: handleAddCamera,
        importObj: handleImportObj,
        duplicateSelected: handleDuplicateSelectedObject,
        deleteSelected: handleDeleteSelectedObject,
        openSettings: () => setSettingsOpen(true),
        openPluginManager: () => setPluginsOpen(true),
        openExportPanel: () => setExportOpen(true),
        exportCurrentFrame: handleExportCurrentFrame,
        exportPngSequence: handleExportSequence,
        savePackage: handleSaveProject,
        exportLegacyProject: handleExportLegacyProject,
        applySky: (sky) => handleSkyChange(sky, project.sky.customColor),
        togglePlayback: handleTogglePlayback,
        resetViewportCamera: handleResetViewportCamera,
        addKeyframe: handleAddKeyframe,
        addEffect: handleAddEffect,
        toggleRenderPreview: handleToggleRenderPreview,
        toggleCinematicBars: handleToggleCinematicBars,
        applyPostPreset: handleApplyPostPreset,
        undo: handleUndo,
        redo: handleRedo
      }, localization),
    [
      handleAddCamera,
      handleAddCharacter,
      handleAddKeyframe,
      handleImportObj,
      handleDuplicateSelectedObject,
      handleDeleteSelectedObject,
      handleExportCurrentFrame,
      handleExportLegacyProject,
      handleExportSequence,
      handleLoadProject,
      handleNewProject,
      handleRedo,
      handleResetViewportCamera,
      handleSaveProject,
      handleAddEffect,
      handleApplyPostPreset,
      handleToggleCinematicBars,
      handleToggleRenderPreview,
      handleSkyChange,
      handleTogglePlayback,
      handleUndo,
      localization,
      project.sky.customColor
    ]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const target = event.target as HTMLElement | null;
      const isTextInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable === true;
      if ((event.ctrlKey || event.metaKey) && key === "p") {
        event.preventDefault();
        setCommandsOpen(true);
      }
      if ((event.ctrlKey || event.metaKey) && key === "s") {
        event.preventDefault();
        handleSaveProject();
      }
      if (
        !isTextInput &&
        (event.ctrlKey || event.metaKey) &&
        key === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        handleUndo();
      }
      if (
        !isTextInput &&
        (((event.ctrlKey || event.metaKey) && key === "y") ||
          ((event.ctrlKey || event.metaKey) && event.shiftKey && key === "z"))
      ) {
        event.preventDefault();
        handleRedo();
      }
      if (!isTextInput && (event.ctrlKey || event.metaKey) && key === "d") {
        event.preventDefault();
        if (selectedEffectId) {
          const effect = projectRef.current.effects.instances.find(
            (candidate) => candidate.id === selectedEffectId
          );
          if (effect) {
            handleEffectTimelineCommand({
              type: "duplicate",
              effectId: effect.id,
              newEffectId: createId("effect"),
              startFrame: effect.startFrame + 1
            });
          }
        } else {
          handleDuplicateSelectedObject();
        }
      }
      if (!isTextInput && event.key === "Delete") {
        event.preventDefault();
        if (selectedEffectId) {
          handleDeleteEffect(selectedEffectId);
        } else {
          handleDeleteSelectedObject();
        }
      }
      if (!isTextInput && event.code === "Space") {
        event.preventDefault();
        handleTogglePlayback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleDeleteEffect,
    handleDeleteSelectedObject,
    handleDuplicateSelectedObject,
    handleEffectTimelineCommand,
    handleRedo,
    handleSaveProject,
    handleTogglePlayback,
    handleUndo,
    selectedEffectId
  ]);

  const statusDetails = [
    localization.t("status.selected", { name: selectedObjectLabel(
      project,
      selectedObjectId,
      selectedObject?.name,
      localization.t("status.character"),
      localization.t("common.none")
    ) }),
    localization.t("status.frame", { frame: localization.formatNumber(project.animation.currentFrame) }),
    localization.t("status.fps", { fps: localization.formatNumber(project.animation.fps) }),
    localization.t(isDirty ? "status.unsaved" : "status.saved"),
    localization.t("status.post", { preset: project.postProcessing.presetId }),
    localization.t("status.lighting", { preset: project.lighting.presetId }),
    localization.t("status.effects", { count: localization.formatNumber(project.effects.instances.length) }),
    localization.t("status.audio", { count: localization.formatNumber(project.audio.clips.length) }),
    localization.t("status.export", { width: project.exportSettings.width, height: project.exportSettings.height }),
    localization.t(project.renderSettings.renderPreviewEnabled ? "status.renderPreview" : "status.viewport"),
    project.world
      ? localization.t("status.world", { name: project.world.sourceName })
      : localization.t("status.worldDemo")
  ].join(" | ");

  return (
    <LocalizationProvider service={localization}>
    <main className="app-shell" lang={localization.language}>
      <TopBar
        projectName={project.projectName}
        isPlaying={project.animation.isPlaying}
        isDirty={isDirty}
        renderPreviewEnabled={project.renderSettings.renderPreviewEnabled}
        onNewProject={handleNewProject}
        onNewProjectFromTemplate={() => setTemplatesOpen(true)}
        onOpenWorld={handleOpenWorld}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onAddCharacter={handleAddCharacter}
        onAddCamera={handleAddCamera}
        onImportObj={handleImportObj}
        onTogglePlayback={handleTogglePlayback}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPlugins={() => setPluginsOpen(true)}
        onOpenCommands={() => setCommandsOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        onOpenRigStudio={() => setRigStudioOpen(true)}
        onOpenLightingStudio={() => setLightingStudioOpen(true)}
        onOpenVfxWorkspace={() => setVfxWorkspaceOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        onToggleRenderPreview={handleToggleRenderPreview}
      />
      <div className="workspace">
        <OutlinerPanel
          project={project}
          selectedObjectId={selectedObjectId}
          onSelectObject={handleSelectObject}
        />
        <EffectsLibraryPanel
          presets={effectPresets}
          customPresets={customVfxPresets}
          selectedEffectId={selectedEffectId}
          effectInstances={project.effects.instances}
          audioClips={project.audio.clips}
          builtinSfx={BUILTIN_SFX}
          postPresets={POST_PROCESSING_PRESETS}
          activePostPresetId={project.postProcessing.presetId}
          renderSettings={project.renderSettings}
          onAddEffect={handleAddEffect}
          onAddCustomEffect={handleAddCustomEffect}
          getCustomSourceStatus={(effect) =>
            getInstalledVfxSourceStatus(effect, vfxPackageRegistry)
          }
          onSelectEffect={handleSelectEffect}
          onApplyPostPreset={handleApplyPostPreset}
          onToggleRenderPreview={handleToggleRenderPreview}
          onToggleCinematicBars={handleToggleCinematicBars}
          onImportAudio={handleImportAudio}
          onAddBuiltinSfx={handleAddBuiltinSfx}
        />
        <Viewport
          project={displayProject}
          selectedObjectId={selectedObjectId}
          onSelectObject={handleSelectObject}
          lookThroughCameraRequest={lookThroughCameraRequest}
          resetCameraRequest={resetCameraRequest}
          focusWorldRequest={focusWorldRequest}
          viewportSettings={settings.viewport}
        />
        <InspectorPanel
          project={project}
          selectedObjectId={selectedObjectId}
          selectedEffectId={selectedEffectId}
          onUpdateTransform={handleUpdateTransform}
          onRenameObject={handleRenameObject}
          onToggleVisibility={handleToggleVisibility}
          onToggleLocked={handleToggleLocked}
          onUpdateEffect={handleUpdateEffect}
          onDeleteEffect={handleDeleteEffect}
          onUpdatePostProcessing={handleUpdatePostProcessing}
          onAddKeyframe={handleAddKeyframe}
          onSkyChange={handleSkyChange}
          onLookThroughCamera={handleLookThroughCamera}
          cameraPresets={presets.camera}
          rigPosePresets={rigPosePresets}
          animationPresets={presets.animation}
          onApplyCameraPreset={handleApplyCameraPreset}
          onApplyRigPosePreset={rigWorkspace.applyPose}
          onApplyAnimationPreset={rigWorkspace.applyAnimation}
          onUpdateBoneRotation={rigWorkspace.updateBoneRotation}
          onAddBoneKeyframe={rigWorkspace.addBoneKeyframe}
          onResetPose={rigWorkspace.resetPose}
          onMirrorPose={rigWorkspace.mirrorPose}
          onImportSkin={handleImportSkin}
          onResetSkin={handleResetSkin}
          onChangeRigPreset={rigWorkspace.changeRigPreset}
        />
      </div>
      <TimelinePanel
        project={project}
        selectedObjectId={selectedObjectId}
        selectedEffectId={selectedEffectId}
        onSetFrame={handleSetFrame}
        onSetFps={handleSetFps}
        onTogglePlayback={handleTogglePlayback}
        onAddKeyframe={handleAddKeyframe}
        onSelectEffect={handleSelectEffect}
        onEditEffectTimeline={handleEffectTimelineCommand}
        onUpdateAnimation={handleUpdateAnimation}
      />
      <div className="status-bar">
        <span>{status}</span>
        <strong>{statusDetails}</strong>
      </div>
      <SettingsModal
        open={settingsOpen}
        appSettings={settings}
        projectSettings={project.projectSettings}
        onClose={() => setSettingsOpen(false)}
        onAppSettingsChange={setSettings}
        onProjectSettingsChange={handleProjectSettingsChange}
      />
      <TemplatePicker
        open={templatesOpen}
        templates={templates}
        onClose={() => setTemplatesOpen(false)}
        onCreateFromTemplate={handleNewProjectFromTemplate}
      />
      <PluginManagerPanel
        open={pluginsOpen}
        plugins={plugins}
        onClose={() => setPluginsOpen(false)}
        onTogglePlugin={handleTogglePlugin}
      />
      <CommandPalette
        open={commandsOpen}
        commands={commands}
        onClose={() => setCommandsOpen(false)}
      />
      <ExportPanel
        open={exportOpen}
        project={project}
        progress={exportProgress}
        isExporting={
          exportProgress.status === "preparing" ||
          exportProgress.status === "rendering" ||
          exportProgress.status === "encoding"
        }
        ffmpegDetection={ffmpegDetection}
        onClose={() => setExportOpen(false)}
        onSettingsChange={handleExportSettingsChange}
        onFfmpegSettingsChange={handleFfmpegSettingsChange}
        onDetectFfmpeg={handleDetectFfmpeg}
        onAddRenderJob={handleAddRenderJob}
        onRunRenderJob={handleRunRenderJob}
        onRemoveRenderJob={handleRemoveRenderJob}
        onClearFinishedRenderJobs={handleClearFinishedRenderJobs}
        onSavePackage={handleSaveProject}
        onExportLegacyProject={handleExportLegacyProject}
        onExportCurrentFrame={handleExportCurrentFrame}
        onExportSequence={handleExportSequence}
        onExportWebM={handleExportWebM}
        onExportWav={handleExportWav}
        onCancelExport={handleCancelExport}
      />
      <RigStudioPanel
        open={rigStudioOpen}
        project={project}
        selectedObjectId={selectedObjectId}
        posePresets={rigPosePresets}
        animationPresets={presets.animation}
        ikControls={rigIKSession.controls}
        ikWarnings={rigIKPreview.warnings}
        onClose={() => setRigStudioOpen(false)}
        onImportSkin={handleImportSkin}
        onResetSkin={handleResetSkin}
        onApplyPose={rigWorkspace.applyPose}
        onSavePose={rigWorkspace.saveCurrentPose}
        onMirrorPose={rigWorkspace.mirrorPose}
        onResetPose={rigWorkspace.resetPose}
        onApplyAnimation={rigWorkspace.applyAnimation}
        onImportBlockbench={handleImportBlockbench}
        onUpdateIKControl={rigIKSession.updateControl}
        onBakeIKControl={rigWorkspace.bakeIK}
      />
      <LightingStudioPanel
        open={lightingStudioOpen}
        lighting={project.lighting}
        postProcessing={project.postProcessing}
        resources={project.minecraftResources}
        resourcePacks={project.assets.resourcePacks}
        currentFrame={project.animation.currentFrame}
        onClose={() => setLightingStudioOpen(false)}
        onApplyMood={handleApplyLightingMood}
        onUpdateLighting={handleUpdateLighting}
        onUpdatePostProcessing={handleUpdatePostProcessing}
        onUpdateResources={handleUpdateMinecraftResources}
        onChooseResourcePackZip={handleChooseResourcePackZip}
        onChooseResourcePackFolder={handleChooseResourcePackFolder}
        onSetActiveResourcePack={handleSetActiveResourcePack}
        onRemoveResourcePack={handleRemoveResourcePack}
        onAddEnvironmentKeyframe={handleAddEnvironmentKeyframe}
      />
      <VfxWorkspacePanel
        open={vfxWorkspaceOpen}
        presets={effectPresets}
        registry={vfxPackageRegistry}
        onRegistryChange={setVfxPackageRegistry}
        onClose={() => setVfxWorkspaceOpen(false)}
      />
      <WorldImportPanel
        open={worldImportOpen}
        scan={worldScan}
        project={project}
        options={worldImportOptions}
        progress={worldImportProgress}
        isImporting={
          worldImportProgress.status === "scanning" ||
          worldImportProgress.status === "reading-level" ||
          worldImportProgress.status === "reading-regions" ||
          worldImportProgress.status === "reading-chunks" ||
          worldImportProgress.status === "meshing"
        }
        onClose={() => setWorldImportOpen(false)}
        onChooseWorldFolder={handleChooseWorldFolder}
        onOptionsChange={handleWorldImportOptionsChange}
        onImportChunks={handleImportWorldChunks}
        onCancelImport={handleCancelWorldImport}
        onFocusWorld={handleFocusWorld}
        onUnloadWorld={handleUnloadWorld}
      />
      <HelpPanel
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onLoadSampleScene={handleLoadSampleScene}
      />
      <input
        ref={worldInputRef}
        className="hidden-input"
        type="file"
        multiple
        {...{ webkitdirectory: "", directory: "" }}
        onChange={handleWorldSelected}
      />
      <input
        ref={projectInputRef}
        className="hidden-input"
        type="file"
        accept=".mmsproj,.minemotion,.json,application/json"
        onChange={handleProjectFileSelected}
      />
      <input
        ref={objInputRef}
        className="hidden-input"
        type="file"
        accept=".obj"
        onChange={handleObjSelected}
      />
      <input
        ref={skinInputRef}
        className="hidden-input"
        type="file"
        accept="image/png,.png"
        onChange={handleSkinSelected}
      />
      <input
        ref={blockbenchInputRef}
        className="hidden-input"
        type="file"
        accept=".bbmodel,application/json,.json"
        onChange={handleBlockbenchSelected}
      />
      <input
        ref={audioInputRef}
        className="hidden-input"
        type="file"
        accept="audio/wav,audio/mpeg,audio/ogg,audio/mp3,.wav,.mp3,.ogg"
        onChange={handleAudioSelected}
      />
      <input
        ref={resourcePackZipInputRef}
        className="hidden-input"
        type="file"
        accept=".zip,application/zip"
        onChange={handleResourcePackZipSelected}
      />
      <input
        ref={resourcePackFolderInputRef}
        className="hidden-input"
        type="file"
        multiple
        {...{ webkitdirectory: "", directory: "" }}
        onChange={handleResourcePackFolderSelected}
      />
    </main>
    </LocalizationProvider>
  );
}

function getViewportShell(): HTMLElement {
  const shell = document.querySelector<HTMLElement>(".viewport-shell");
  if (!shell) {
    throw new Error("Viewport is not mounted.");
  }
  return shell;
}

function downloadExportResult(result: ExportResult): void {
  downloadBlob(result.blob, result.filename);
}

function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function selectedObjectLabel(
  project: MineMotionProject,
  selectedObjectId: string | null,
  fallback: string | undefined,
  characterLabel: string,
  noneLabel: string
): string {
  const boneSelection = parseRigBoneSelection(selectedObjectId);
  if (boneSelection) {
    const character = project.scene.characters.find(
      (item) => item.id === boneSelection.characterId
    );
    return `${character?.name ?? characterLabel} / ${boneSelection.boneId}`;
  }
  return fallback ?? noneLabel;
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
