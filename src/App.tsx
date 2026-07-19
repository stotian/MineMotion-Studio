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
import { applyRigPosePreset } from "./presets/RigPosePresets";
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
import { createRenderStateSnapshot } from "./rendering/export/RenderStateSnapshot";
import { restoreRenderState } from "./rendering/export/RenderStateRestore";
import { type SkyPresetId } from "./renderer/SkySystem";
import { Viewport } from "./renderer/Viewport";
import { BlockbenchImporter } from "./rigs/blockbench/BlockbenchImporter";
import { getDefaultBoneRotations } from "./rigs/RigDefinition";
import { getRigDefinition } from "./rigs/MinecraftRigPresets";
import { MinecraftSkinImporter } from "./rigs/MinecraftSkinImporter";
import {
  addBoneRotationKeyframe,
  updateProjectBoneRotation
} from "./rigs/RigController";
import {
  mirrorCurrentPose,
  resetRigPose,
  savePoseFromCharacter
} from "./rigs/RigInstance";
import { getSelectedCharacterId, parseRigBoneSelection } from "./rigs/RigSelection";
import type { RigPresetId } from "./rigs/RigTypes";
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
  const [project, setProjectState] = useState<MineMotionProject>(() =>
    createInitialProject(settings)
  );
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
    project.scene.characters[0]?.id ?? null
  );
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);
  const [status, setStatus] = useState(
    "Ready. Professional animation, resource-pack, and lighting systems loaded."
  );
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

  useEffect(() => {
    if (
      selectedEffectId &&
      !project.effects.instances.some((effect) => effect.id === selectedEffectId)
    ) {
      setSelectedEffectId(null);
    }
  }, [project.effects.instances, selectedEffectId]);

  const displayProject = useMemo(() => {
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

  useEffect(() => {
    SettingsStore.save(settings);
    document.documentElement.style.setProperty(
      "--ui-scale",
      String(settings.editor.uiScale)
    );
  }, [settings]);

  useEffect(() => {
    if (!hasProjectAutosave(window.localStorage)) return;

    const shouldRestore = window.confirm(
      "A MineMotion autosave was found in this browser. Restore it?"
    );
    if (!shouldRestore) return;

    try {
      const recovered = loadProjectAutosave(window.localStorage);
      if (!recovered) return;
      const restored = recovered.project;
      setProject(restored);
      setSelectedObjectId(restored.scene.characters[0]?.id ?? null);
      setStatus(
        recovered.source === "backup"
          ? "Primary autosave was invalid; the retained backup was restored."
          : "Autosaved project restored from browser storage."
      );
      setIsDirty(true);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `${error.message} Stored recovery data was retained.`
          : "Autosave recovery failed; stored recovery data was retained."
      );
    }
  }, []);

  useEffect(() => {
    if (!settings.general.autosaveEnabled || !isDirty) return;

    const interval = window.setInterval(() => {
      try {
        saveProjectAutosave(window.localStorage, project);
        setStatus(`Autosaved ${project.projectName} to browser storage.`);
      } catch (error) {
        setStatus(
          error instanceof Error
            ? `Autosave failed: ${error.message}`
            : "Autosave failed."
        );
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
    return window.confirm("Current project has unsaved changes. Continue?");
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
    replaceProject(createInitialProject(settings), "New project created.");
  }, [confirmDiscardChanges, replaceProject, settings]);

  const handleNewProjectFromTemplate = useCallback(
    (templateId: string) => {
      if (!confirmDiscardChanges()) return;
      const nextProject = templateRegistry.createProject(templateId, settings);
      replaceProject(nextProject, `Template loaded: ${nextProject.projectName}.`);
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
    setStatus(`Project saved as ${filename}.`);
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
      setStatus(`Legacy schema 9 project exported as ${filename}.`);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Project contains native VFX data that schema 9 cannot represent."
      );
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
      setStatus(`Loaded project ${loadedProject.projectName}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load project.");
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
          message: "Scanning Minecraft world folder."
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
          message: `Scanned ${scan.sourceName}.`
        })
      );
      setStatus(
        `World scan complete: ${scan.sourceName}, ${scan.dimensions
          .map((dimension) => `${dimension.label} ${dimension.regionFiles.length}`)
          .join(", ")} region files.`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not scan world folder.";
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
      setStatus("Choose a Minecraft world folder before importing chunks.");
      return;
    }

    worldImportCancelledRef.current = false;
    setWorldImportProgress(
      createWorldImportProgress({
        status: "reading-regions",
        message: "Preparing chunk import."
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
        `Imported ${result.chunks.length} chunks and ${result.estimate.importedBlocks} blocks from ${result.world.sourceName}.`
      );
    } catch (error) {
      const cancelled = worldImportCancelledRef.current;
      const message =
        error instanceof Error ? error.message : "Minecraft chunk import failed.";
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
        message: "World import cancellation requested."
      })
    );
    setStatus("World import cancellation requested.");
  }, []);

  const handleFocusWorld = useCallback(() => {
    setFocusWorldRequest((value) => value + 1);
    setStatus("Viewport focused on imported world.");
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
    setStatus("Imported world unloaded; demo terrain restored.");
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
    setStatus(`Added ${character.name}.`);
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
    setStatus(`Added ${camera.name}.`);
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
          ? `Imported OBJ with warning: ${imported.warnings.join(" ")}`
          : `Imported OBJ ${imported.name}.`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import OBJ.");
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
      setStatus("Select a character before importing a skin.");
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
          ? `Imported skin ${skin.name} (${skin.metadata.width}x${skin.metadata.height}, ${skin.metadata.modelType}).`
          : `Skin ${skin.name} imported but invalid; fallback colors remain active.`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import skin.");
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
      setStatus("Skin reset to fallback Minecraft colors.");
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
        `Imported Blockbench model ${imported.asset.name}: ${imported.asset.elementCount} cubes, ${imported.asset.groupCount} groups.`
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not import Blockbench model."
      );
    }
  };

  const handleUpdateTransform = useCallback(
    (objectId: string, transform: TransformData) => {
      const lookup = findObject(project, objectId);
      if (lookup?.entity.locked) {
        setStatus(`${lookup.entity.name} is locked.`);
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
        setStatus("Move before the final project frame to add an effect.");
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
        setStatus(result.errors[0]?.message ?? "Could not add cinematic effect.");
        return;
      }
      if (result.value.changed) {
        commitProject(result.value.project, result.value.historyLabel);
      }
      setSelectedEffectId(result.value.selectedEffectId);
      setSelectedObjectId(null);
      setStatus(`Added effect ${effect.name} at frame ${effect.startFrame}.`);
    },
    [commitProject, selectedObjectId]
  );

  const handleEffectTimelineCommand = useCallback(
    (command: EffectTimelineCommand) => {
      const result = applyEffectTimelineCommand(projectRef.current, command);
      if (!result.ok) {
        const message =
          result.errors[0]?.message ?? "Effect timeline edit failed.";
        setStatus(message);
        return message;
      }
      if (!result.value.changed) {
        setStatus("Effect timeline already has that value.");
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
      setStatus(`Post-processing preset applied: ${preset.name}.`);
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
      setStatus("Post-processing updated.");
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
    setStatus("Render preview toggled.");
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
    setStatus("Cinematic bars toggled.");
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
          message: "FFmpeg executable changed. Run detection again."
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
    setStatus("Detecting FFmpeg...");
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
    setStatus(`Added ${job.name} to the render queue.`);
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
      const message = validation.errors.join(" ");
      setStatus(message);
      setExportProgress(
        createExportProgress({
          status: "error",
          message: "Export settings are invalid.",
          error: message
        })
      );
      return false;
    }
    if (validation.warnings.length > 0) {
      setStatus(validation.warnings.join(" "));
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
        message: "Capturing current viewport frame."
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
          message: `Exported ${result.filename}.`
        })
      );
      setStatus(`Exported ${result.filename}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "PNG export failed.";
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
        message: "Preparing PNG sequence export."
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
          message: `Exported ${result.filename}.`
        })
      );
      setStatus(`Exported ${result.filename}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "PNG sequence export failed.";
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
        message: "Recording viewport canvas as WebM."
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
              message: `Recording frame ${index} of ${totalFrames}.`
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
          message: `Exported ${filename}.`
        })
      );
      setStatus(`Exported ${filename} at ${settings.width}x${settings.height}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "WebM export failed.";
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
        message: "Mixing project audio to WAV."
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
          message: `Exported ${filename}.`
        })
      );
      setStatus(`Exported ${filename}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "WAV export failed.";
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
        message: "Export cancellation requested."
      })
    );
    setStatus("Export cancellation requested.");
  }, []);

  const handleAudioSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setStatus("Unsupported SFX file type. Use wav, mp3, or ogg audio.");
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
      setStatus(`Imported SFX ${clip.name}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import SFX.");
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
      setStatus(`Added placeholder SFX ${clip.name}.`);
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
      setStatus("Select an object before duplicating.");
      return;
    }
    if (lookup.entity.locked) {
      setStatus(`${lookup.entity.name} is locked.`);
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
    setStatus(`Duplicated ${lookup.entity.name}.`);
  }, [commitProject, project, selectedObjectId]);

  const handleUpdateBoneRotation = useCallback(
    (characterId: string, boneId: string, rotation: [number, number, number]) => {
      const character = project.scene.characters.find((item) => item.id === characterId);
      if (character?.locked) {
        setStatus(`${character.name} is locked.`);
        return;
      }
      commitProject(
        (currentProject) =>
          updateProjectBoneRotation(currentProject, characterId, boneId, rotation),
        "Edit bone rotation"
      );
      setStatus(`Updated ${boneId} rotation.`);
    },
    [commitProject, project.scene.characters]
  );

  const handleAddBoneKeyframe = useCallback(
    (characterId: string, boneId: string) => {
      commitProject(
        (currentProject) =>
          syncCinematicTimeline(
            addBoneRotationKeyframe(
              currentProject,
              characterId,
              boneId,
              currentProject.animation.currentFrame
            )
          ),
        "Add bone keyframe"
      );
      setStatus(`Bone keyframe added for ${boneId} at frame ${project.animation.currentFrame}.`);
    },
    [commitProject, project.animation.currentFrame]
  );

  const handleResetPose = useCallback(
    (characterId: string) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          scene: {
            ...currentProject.scene,
            characters: currentProject.scene.characters.map((character) =>
              character.id === characterId ? resetRigPose(character) : character
            )
          }
        }),
        "Reset rig pose"
      );
      setStatus("Rig pose reset.");
    },
    [commitProject]
  );

  const handleMirrorPose = useCallback(
    (characterId: string) => {
      commitProject(
        (currentProject) => ({
          ...currentProject,
          scene: {
            ...currentProject.scene,
            characters: currentProject.scene.characters.map((character) =>
              character.id === characterId ? mirrorCurrentPose(character) : character
            )
          }
        }),
        "Mirror rig pose"
      );
      setStatus("Rig pose mirrored left/right.");
    },
    [commitProject]
  );

  const handleSaveCurrentPose = useCallback(
    (characterId: string) => {
      const character = project.scene.characters.find((item) => item.id === characterId);
      if (!character) return;
      const name = window.prompt("Pose name", `${character.name} Pose`);
      if (!name) return;
      const pose = savePoseFromCharacter(character, name);
      commitProject(
        (currentProject) => ({
          ...currentProject,
          rigs: {
            ...currentProject.rigs,
            savedPoses: [...currentProject.rigs.savedPoses, pose]
          }
        }),
        "Save current pose"
      );
      setStatus(`Saved pose ${pose.name}.`);
    },
    [commitProject, project.scene.characters]
  );

  const handleChangeRigPreset = useCallback(
    (characterId: string, presetId: RigPresetId) => {
      const definition = getRigDefinition(presetId);
      commitProject(
        (currentProject) => ({
          ...currentProject,
          scene: {
            ...currentProject.scene,
            characters: currentProject.scene.characters.map((character) =>
              character.id === characterId
                ? {
                    ...character,
                    rigPreset: definition.id,
                    modelType: definition.modelType,
                    boneRotations: {
                      ...getDefaultBoneRotations(definition),
                      ...character.boneRotations
                    }
                  }
                : character
            )
          }
        }),
        "Change rig preset"
      );
      setStatus(`Rig preset changed to ${definition.name}.`);
    },
    [commitProject]
  );

  const handleDeleteSelectedObject = useCallback(() => {
    if (!selectedObjectId) return;
    const lookup = findObject(project, selectedObjectId);
    if (!lookup) {
      setStatus("Select an object before deleting.");
      return;
    }
    if (lookup.entity.locked) {
      setStatus(`${lookup.entity.name} is locked.`);
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
    setStatus(`Deleted ${lookup.entity.name}.`);
  }, [commitProject, project, selectedObjectId]);

  const handleAddKeyframe = useCallback(() => {
    const boneSelection = parseRigBoneSelection(selectedObjectId);
    if (boneSelection) {
      handleAddBoneKeyframe(boneSelection.characterId, boneSelection.boneId);
      return;
    }

    if (!selectedObjectId || selectedObjectId === "world") {
      setStatus("Select a character, camera, light, or OBJ before keyframing.");
      return;
    }

    const lookup = findObject(project, selectedObjectId);
    if (!lookup) {
      setStatus("Selected object is not keyframeable.");
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
      `Transform keyframe added for ${lookup.entity.name} at frame ${project.animation.currentFrame}.`
    );
  }, [commitProject, handleAddBoneKeyframe, project, selectedObjectId]);

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
      setStatus(`Sky preset set to ${preset}.`);
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
      setStatus(`Lighting mood applied: ${preset.name}.`);
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
      setStatus("Lighting updated.");
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
      setStatus("Minecraft material settings updated.");
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
        `Imported resource pack ${pack.name}: ${pack.textures.length} block textures.`
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Could not import resource pack ZIP."
      );
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
        `Imported resource pack ${pack.name}: ${pack.textures.length} block textures.`
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Could not import resource pack folder."
      );
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
      setStatus(packId ? "Resource pack applied." : "Resource pack textures reset.");
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
      setStatus("Resource pack removed.");
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
      `Environment keyframe added at frame ${project.animation.currentFrame}.`
    );
  }, [commitProject, project.animation.currentFrame]);

  const handleProjectSettingsChange = useCallback(
    (projectSettings: ProjectSettings) => {
      commitProject(
        (currentProject) => updateProjectSettings(currentProject, projectSettings),
        "Change project settings"
      );
      setStatus("Project settings updated.");
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
      setStatus("Select a scene camera first.");
      return;
    }
    setLookThroughCameraRequest((value) => value + 1);
    setStatus("Viewport moved to selected camera position.");
  }, [project, selectedObjectId]);

  const handleResetViewportCamera = useCallback(() => {
    setResetCameraRequest((value) => value + 1);
    setStatus("Viewport camera reset to the first scene camera.");
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
      setStatus(`Camera preset applied: ${preset.name}.`);
    },
    [commitProject, selectedObjectId]
  );

  const handleApplyRigPosePreset = useCallback(
    (presetId: string) => {
      const characterId =
        getSelectedCharacterId(selectedObjectId) ?? project.scene.characters[0]?.id;
      if (!characterId) return;
      const preset =
        presetRegistry.getRigPosePreset(presetId) ??
        project.rigs.savedPoses.find((candidate) => candidate.id === presetId);
      if (!preset) return;
      commitProject(
        (currentProject) => ({
          ...currentProject,
          scene: {
            ...currentProject.scene,
            characters: currentProject.scene.characters.map((character) =>
              character.id === characterId
                ? applyRigPosePreset(character, preset)
                : character
            )
          }
        }),
        "Apply rig pose preset"
      );
      setStatus(`Pose applied: ${preset.name}.`);
    },
    [commitProject, project.rigs.savedPoses, project.scene.characters, selectedObjectId]
  );

  const handleApplyAnimationPreset = useCallback(
    (presetId: string) => {
      const targetId =
        getSelectedCharacterId(selectedObjectId) ?? project.scene.characters[0]?.id;
      if (!targetId) return;
      const preset = presetRegistry.getAnimationPreset(presetId);
      if (!preset) return;
      commitProject(
        (currentProject) => syncCinematicTimeline(preset.apply(currentProject, targetId)),
        "Apply animation preset"
      );
      setStatus(`Animation preset applied: ${preset.name}.`);
    },
    [commitProject, project.scene.characters, selectedObjectId]
  );

  const handleUndo = useCallback(() => {
    const previousProject = historyRef.current.undo(projectRef.current);
    if (!previousProject) {
      setStatus("Nothing to undo.");
      return;
    }
    setProject(previousProject);
    setIsDirty(true);
    setStatus("Undo.");
  }, [setProject]);

  const handleRedo = useCallback(() => {
    const nextProject = historyRef.current.redo(projectRef.current);
    if (!nextProject) {
      setStatus("Nothing to redo.");
      return;
    }
    setProject(nextProject);
    setIsDirty(true);
    setStatus("Redo.");
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
      setStatus(`${enabled ? "Enabled" : "Disabled"} plugin ${pluginId}.`);
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
      }),
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
    `Selected: ${selectedObjectLabel(project, selectedObjectId, selectedObject?.name)}`,
    `Frame: ${project.animation.currentFrame}`,
    `FPS: ${project.animation.fps}`,
    isDirty ? "Unsaved" : "Saved",
    `Post: ${project.postProcessing.presetId}`,
    `Lighting: ${project.lighting.presetId}`,
    `FX: ${project.effects.instances.length}`,
    `SFX: ${project.audio.clips.length}`,
    `Export: ${project.exportSettings.width}x${project.exportSettings.height}`,
    project.renderSettings.renderPreviewEnabled ? "Render Preview" : "Viewport",
    project.world ? `World: ${project.world.sourceName}` : "World: demo"
  ].join(" | ");

  return (
    <main className="app-shell">
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
          selectedEffectId={selectedEffectId}
          effectInstances={project.effects.instances}
          audioClips={project.audio.clips}
          builtinSfx={BUILTIN_SFX}
          postPresets={POST_PROCESSING_PRESETS}
          activePostPresetId={project.postProcessing.presetId}
          renderSettings={project.renderSettings}
          onAddEffect={handleAddEffect}
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
          onApplyRigPosePreset={handleApplyRigPosePreset}
          onApplyAnimationPreset={handleApplyAnimationPreset}
          onUpdateBoneRotation={handleUpdateBoneRotation}
          onAddBoneKeyframe={handleAddBoneKeyframe}
          onResetPose={handleResetPose}
          onMirrorPose={handleMirrorPose}
          onImportSkin={handleImportSkin}
          onResetSkin={handleResetSkin}
          onChangeRigPreset={handleChangeRigPreset}
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
        onClose={() => setRigStudioOpen(false)}
        onImportSkin={handleImportSkin}
        onResetSkin={handleResetSkin}
        onApplyPose={handleApplyRigPosePreset}
        onSavePose={handleSaveCurrentPose}
        onMirrorPose={handleMirrorPose}
        onResetPose={handleResetPose}
        onApplyAnimation={handleApplyAnimationPreset}
        onImportBlockbench={handleImportBlockbench}
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
  fallback?: string
): string {
  const boneSelection = parseRigBoneSelection(selectedObjectId);
  if (boneSelection) {
    const character = project.scene.characters.find(
      (item) => item.id === boneSelection.characterId
    );
    return `${character?.name ?? "Character"} / ${boneSelection.boneId}`;
  }
  return fallback ?? "none";
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
